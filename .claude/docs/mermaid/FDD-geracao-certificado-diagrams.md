# Diagramas Mermaid - Geração de Certificado

## Visão Geral

A Edge Function `generate-certificate` recebe uma chamada do frontend do aluno, valida autenticação e elegibilidade por progresso (mínimo 90%), garante idempotência via consulta prévia à tabela `certificates`, gera o PDF com `pdf-lib` em A4 landscape, persiste no bucket privado `certificates` e devolve ao frontend a linha do certificado acompanhada de uma signed URL com TTL de 300 s. A função usa dois clientes Supabase distintos: um com o JWT do utilizador (para leituras com RLS) e um com service-role (para escrita em `certificates` e `storage.objects`). Notificação via `send-notification` é disparada em modo best-effort, não interrompendo o fluxo principal em caso de falha.

## Elementos Identificados

### Fluxos Externos

- Frontend (aluno) invoca `certificatesService.generate(productId)` via hook `useGenerateCertificate`
- Edge Function `generate-certificate` recebe POST HTTPS com JWT no header `Authorization`
- Sistema de Progresso (FDD-005) é a fonte de verdade de `user_progress.progress_percentage`
- Edge Function `send-notification` é chamada como best-effort após emissão de certificado novo
- Frontend recebe `{ certificate, downloadUrl }` e abre nova aba para download

### Processos Internos

- Validação JWT e extracção de `user_id`
- Leitura de `user_progress` e cálculo de média de `progress_percentage` por módulos do produto
- Consulta a `certificates` por `(user_id, product_id)` para idempotência
- Geração de número `CERT-YYYY-XXXXXX` com `crypto.getRandomValues`
- Renderização de PDF em A4 landscape com Helvetica / Helvetica-Bold via `pdf-lib`
- Upload para bucket `certificates` com `upsert: true`
- UPDATE de `certificates.pdf_url` com o caminho relativo
- Geração de signed URL com TTL 300 s
- Loop de retry até `MAX_INSERT_ATTEMPTS = 5` para colisão de `certificate_number`
- Captura de erro `23505` diferenciando constraint `(user_id, product_id)` vs `certificate_number`

### Variações de Comportamento

- **Caso 5a (idempotência feliz):** linha existe com `pdf_url` preenchido; retorna imediatamente sem regenerar
- **Caso 5b (recovery):** linha existe com `pdf_url = NULL`; regenera apenas PDF e faz UPDATE
- **Caso 5c (novo):** sem linha; gera número, INSERT, gera PDF, dispara notificação
- **Race condition:** segundo INSERT rejeitado por `UNIQUE(user_id, product_id)` com código `23505`; handler relê linha vencedora
- **Colisão de número:** INSERT rejeitado por `UNIQUE(certificate_number)`; handler retentar com novo número até 5 tentativas

### Contratos Públicos

- `GenerateCertificateResponse { certificate: Certificate, downloadUrl: string }`
- `certificatesService.generate(productId)` / `getDownloadUrl(cert)` / `findByUserAndProduct(userId, productId)`
- `useGenerateCertificate()` mutation / `useCertificate(userId, productId)` query
- Caminho Storage: `{user_id}/{certificate_number}.pdf` no bucket `certificates`
- Signed URL TTL: 300 s
- Threshold de progresso: 90%

---

## Diagramas

### Fluxo End-to-End

Este diagrama de sequência representa o caminho completo desde a acção do aluno no frontend até à entrega da signed URL para download do PDF. Mostra a ordem temporal das interacções entre o frontend, a Edge Function, as tabelas do banco de dados, o Storage e a função de notificação, evidenciando os dois clientes Supabase utilizados (JWT do utilizador e service-role). É o diagrama central para compreender como todos os componentes colaboram numa chamada bem-sucedida de geração de certificado.

```mermaid
sequenceDiagram
    participant A as Aluno (Frontend)
    participant EF as "Edge Function"
    participant DB as "Supabase DB"
    participant ST as "Storage"
    participant SN as "send-notification"

    A->>EF: POST /generate-certificate<br/>(JWT + productId)
    EF->>DB: getUser() via JWT
    DB-->>EF: user_id

    EF->>DB: SELECT user_progress<br/>(user_id, product_id)
    DB-->>EF: progress_percentage

    alt progresso < 90%
        EF-->>A: 400 Insufficient progress
    else progresso >= 90%
        EF->>DB: SELECT profiles, products, admin profile
        DB-->>EF: studentName, productTitle, adminName

        EF->>DB: SELECT certificates<br/>(user_id, product_id)
        DB-->>EF: linha existente ou null

        alt linha existe + pdf_url preenchido
            EF->>ST: createSignedUrl (TTL 300s)
            ST-->>EF: signed URL
            EF-->>A: 200 { certificate, downloadUrl }
        else linha existe + pdf_url null
            EF->>EF: Renderiza PDF (pdf-lib)
            EF->>ST: upload certificates/{user_id}/{number}.pdf
            ST-->>EF: OK
            EF->>DB: UPDATE certificates SET pdf_url
            DB-->>EF: certificado actualizado
            EF->>ST: createSignedUrl (TTL 300s)
            ST-->>EF: signed URL
            EF-->>A: 200 { certificate, downloadUrl }
        else sem linha existente
            EF->>DB: INSERT certificates (novo número)
            DB-->>EF: linha inserida
            EF->>EF: Renderiza PDF (pdf-lib)
            EF->>ST: upload certificates/{user_id}/{number}.pdf
            ST-->>EF: OK
            EF->>DB: UPDATE certificates SET pdf_url
            DB-->>EF: certificado actualizado
            EF->>ST: createSignedUrl (TTL 300s)
            ST-->>EF: signed URL
            EF->>SN: send-notification (best-effort)
            EF-->>A: 201 { certificate, downloadUrl }
        end
    end
```

**Notas**:
- O cliente JWT do utilizador é usado para `getUser()` e `SELECT user_progress`; o cliente service-role é usado para INSERT/UPDATE em `certificates` e operações em `storage.objects`
- `send-notification` é chamada apenas para certificados novos (`isNew = true`) e erros nesta chamada são capturados como warning sem falhar a resposta
- Status 200 cobre tanto o caso de certificado já existente (5a) quanto o de recovery (5b, linha sem `pdf_url`); status 201 é exclusivo de certificado novo (5c)

---

### Lógica Interna da Edge Function

Este fluxograma detalha os onze passos sequenciais executados dentro da Edge Function `generate-certificate`, incluindo todos os pontos de decisão e as saídas de erro possíveis. É essencial para compreender a ordem das operações e quais falhas interrompem o fluxo (erros lançados) versus quais são absorvidas (notificação best-effort). O diagrama também deixa claro que a renderização do PDF só ocorre quando necessário, tornando o fluxo eficiente para chamadas repetidas.

```mermaid
flowchart TD
    A([Recebe POST]) --> B{JWT presente?}
    B -->|não| ERR401[Retorna 401]
    B -->|sim| C[Valida JWT<br/>extrai user_id]
    C --> D{user_id válido?}
    D -->|não| ERR401b[Retorna 401]
    D -->|sim| E[Lê productId do body]
    E --> F{productId presente?}
    F -->|não| ERR400[Retorna 400]
    F -->|sim| G[Lê user_progress<br/>calcula média]
    G --> H{Progresso >= 90%?}
    H -->|não| ERR400p[Retorna 400<br/>progresso insuficiente]
    H -->|sim| I[Carrega profiles<br/>products e admin]
    I --> J{Dados encontrados?}
    J -->|não| ERR404[Retorna 404]
    J -->|sim| K[ensureCertificateRow]
    K --> L{pdf_url preenchido?}
    L -->|sim| M[Gera signed URL<br/>TTL 300s]
    L -->|não| N[Renderiza PDF<br/>via pdf-lib]
    N --> O[Upload Storage<br/>upsert true]
    O --> P{Upload OK?}
    P -->|não| ERR500[Retorna 500]
    P -->|sim| Q[UPDATE pdf_url<br/>em certificates]
    Q --> R{isNew?}
    R -->|sim| S[send-notification<br/>best-effort]
    R -->|não| M
    S --> M
    M --> T([Retorna certificate<br/>+ downloadUrl])
```

**Notas**:
- `ensureCertificateRow` encapsula a lógica de idempotência e retry (detalhada no diagrama seguinte); o fluxo aqui assume que retorna com sucesso
- `upload Storage upsert: true` garante que uma retentativa sobrescreve ficheiro parcial sem erro de conflito
- O caminho `pdf_url preenchido = sim` nunca passa por `isNew` porque `isNew = false` nesses casos; a notificação só é disparada para certificados verdadeiramente novos

---

### Máquina de Estados de Idempotência

Este fluxograma representa os três casos de idempotência definidos no FDD (casos 5a, 5b e 5c), mostrando como a Edge Function reage consoante o estado da linha em `certificates` e da presença do ficheiro PDF no Storage. Compreender este diagrama é crítico para perceber por que uma chamada repetida nunca duplica dados nem dispara notificações indevidas. Inclui também o quarto caso de race condition entre chamadas simultâneas, resolvido via captura do erro `23505`.

```mermaid
flowchart TD
    START([ensureCertificateRow]) --> Q1{Linha existe em<br/>certificates?}

    Q1 -->|sim| Q2{pdf_url preenchido?}
    Q2 -->|sim| R_5A[Retorna linha<br/>isNew = false]:::caso5a
    Q2 -->|não| R_5B[Regenera PDF<br/>UPDATE pdf_url<br/>isNew = false]:::caso5b

    Q1 -->|não| INS[Gera certificate_number<br/>tenta INSERT]
    INS --> Q3{INSERT OK?}
    Q3 -->|sim| R_5C[Retorna linha nova<br/>isNew = true]:::caso5c

    Q3 -->|não - 23505| Q4{Linha existe agora?}
    Q4 -->|sim - race| RACE[Retorna linha vencedora<br/>isNew = false]:::race
    Q4 -->|não - colisão número| RETRY{Tentativas < 5?}
    RETRY -->|sim| INS
    RETRY -->|não| ERR500([Retorna 500])

    classDef caso5a fill:#d4edda,stroke:#28a745,color:#155724
    classDef caso5b fill:#fff3cd,stroke:#ffc107,color:#856404
    classDef caso5c fill:#cce5ff,stroke:#0066cc,color:#004085
    classDef race fill:#f8d7da,stroke:#dc3545,color:#721c24
```

**Notas**:
- Verde (5a): caminho feliz idempotente; nenhuma operação de escrita ocorre
- Amarelo (5b): recovery; o PDF é regenerado mas nenhuma linha nova é criada e nenhuma notificação é disparada
- Azul (5c): primeira emissão; INSERT, PDF, notificação
- Vermelho (race): duas chamadas simultâneas; a segunda captura `23505` na constraint `UNIQUE(user_id, product_id)`, relê a linha criada pela primeira e retorna idempotente
- O loop de retry (até 5 tentativas) só ocorre quando `23505` refere a constraint `UNIQUE(certificate_number)`; a distinção é feita relendo `certificates` após o erro

---

### Geração de Número com Retry

Este fluxograma foca o mecanismo de geração do `certificate_number` e o loop de retry isolado para colisões estatísticas. O FDD distingue explicitamente dois tipos de violação `UNIQUE` no INSERT: a colisão de `(user_id, product_id)` (race condition, resolvida de forma terminal e idempotente) e a colisão de `certificate_number` (transitória, resolvida por retry com novo número). Compreender esta distinção é importante para garantir que o handler não confunde os dois casos e não entra em loop infinito.

```mermaid
flowchart TD
    A([Inicio]) --> B[crypto.getRandomValues<br/>gera 3 bytes]
    B --> C[Formata CERT-YYYY-XXXXXX]
    C --> D[INSERT certificates]
    D --> E{Resultado?}

    E -->|OK| F([Retorna isNew = true])

    E -->|23505| G[Relê certificates<br/>por user_id + product_id]
    G --> H{Linha encontrada?}

    H -->|sim - race| I([Retorna isNew = false<br/>linha vencedora])
    H -->|não - colisão número| J{Tentativas < 5?}

    J -->|sim| K[Incrementa tentativa]
    K --> B
    J -->|não| L([Retorna 500<br/>sem número único])
```

**Notas**:
- `crypto.getRandomValues` produz 3 bytes (24 bits); o número é `(bytes[0] << 16 | bytes[1] << 8 | bytes[2]) % 1_000_000`, resultando em 6 dígitos com distribuição uniforme
- O espaço de valores é 10^6 por ano; o FDD indica revisão de formato (para 8 caracteres) ao atingir 5000 emissões/ano (paradoxo do aniversário)
- A releitura após `23505` é o único mecanismo para distinguir o tipo de constraint violada, pois o Supabase client não expõe o nome da constraint directamente

---

### Estrutura do Bucket e Políticas RLS

Este diagrama representa a organização dos ficheiros no bucket privado `certificates` e as três políticas RLS que controlam o acesso. A estrutura de pasta por `user_id` é central para a política de prefixo do aluno e para facilitar remoção em cascata. O diagrama torna imediatamente visível quais actores podem ler ou escrever e por qual mecanismo, o que é crítico para auditar a segurança da feature.

```mermaid
flowchart TD
    BKT[("Bucket: certificates<br/>(privado)")]

    BKT --> U1["user_id_A/"]
    BKT --> U2["user_id_B/"]
    U1 --> F1["CERT-2026-000123.pdf"]
    U1 --> F2["CERT-2026-000456.pdf"]
    U2 --> F3["CERT-2026-000789.pdf"]

    subgraph "Políticas RLS (storage.objects)"
        P1["users_read_own_certificates<br/>SELECT onde foldername[1] = auth.uid()"]
        P2["service_role_writes_certificates<br/>INSERT onde auth.role() = service_role"]
        P3["admins_read_their_product_certificates<br/>SELECT via JOIN certificates + products"]
    end

    A1[Aluno A] -->|"signed URL (TTL 300s)"| F1
    A1 -->|"signed URL (TTL 300s)"| F2
    A2[Aluno B] -->|"signed URL (TTL 300s)"| F3
    EF["Edge Function<br/>(service-role)"] -->|"upload / createSignedUrl"| BKT
    ADM[Admin do Produto] -->|"via P3"| F1

    P1 -.->|"protege"| U1
    P2 -.->|"restringe escrita"| BKT
    P3 -.->|"protege"| F1
```

**Notas**:
- O frontend nunca acede ao Storage directamente; sempre via signed URL gerada pela Edge Function ou pelo `certificatesService.getDownloadUrl()`
- A política `service_role_writes_certificates` garante que apenas a Edge Function pode criar ficheiros; o aluno nunca faz upload directo
- A signed URL tem TTL 300 s, suficiente para download imediato mas demasiado curta para partilha indevida (conforme ADR-006)
- Ficheiros têm limite de 5 MB; PDF típico gerado por `pdf-lib` fica abaixo de 100 KB

---

### Contratos Públicos do ServiceLayer

Este diagrama de classes representa as interfaces e tipos públicos do ServiceLayer e dos hooks que o frontend consome para interagir com a feature de certificado. Evidencia a separação de responsabilidades: `certificatesService` abstrai as chamadas à Edge Function e ao banco de dados, enquanto os hooks `useGenerateCertificate` e `useCertificate` gerem estado de cache via TanStack Query. O diagrama também torna claro que `getDownloadUrl` é usado para acessos posteriores (listagem de certificados), onde a URL original já expirou.

```mermaid
classDiagram
    class GenerateCertificateResponse {
        +certificate: Certificate
        +downloadUrl: string
    }

    class Certificate {
        +id: string
        +user_id: string
        +product_id: string
        +certificate_number: string
        +pdf_url: string
        +issued_at: string
    }

    class certificatesService {
        +generate(productId) GenerateCertificateResponse
        +findByUserAndProduct(userId, productId) Certificate
        +getDownloadUrl(cert) string
    }

    class useGenerateCertificate {
        +mutate(productId) void
        +onSuccess: abre downloadUrl
        +onError: toast global
    }

    class useCertificate {
        +data: Certificate
        +staleTime: 1h
        +enabled: userId and productId
    }

    certificatesService --> GenerateCertificateResponse : generate()
    GenerateCertificateResponse --> Certificate
    useGenerateCertificate --> certificatesService : mutationFn
    useCertificate --> certificatesService : queryFn
```

**Notas**:
- `certificatesService` é o único caminho do frontend para esta feature; páginas não invocam directamente a Edge Function
- `staleTime: 1h` no `useCertificate` reflecte que o certificado é imutável após emissão
- `getDownloadUrl` chama `storageService.getSignedUrl('certificates', cert.pdf_url, 300)` e é usado em páginas de listagem onde a URL devolvida no momento da geração já expirou
- Erros propagam como exception conforme o padrão do FDD-003; interceptação de "Insufficient progress" é feita na página `Certificate.tsx`, não no hook

---

### Cenários de Falha e Recuperação

Este fluxograma representa os principais cenários de falha identificados no FDD e os caminhos de recuperação disponíveis para cada um. É especialmente útil para entender o comportamento do sistema quando operações parciais deixam a tabela `certificates` num estado intermédio (linha com `pdf_url = NULL`), e como a idempotência garante que uma nova chamada do cliente resolve o problema sem intervenção manual. Também deixa claro quais falhas são aceites em v1.0 (notificação) e quais exigem retentativa do cliente ou escalamento de plano.

```mermaid
flowchart TD
    START([Falha detectada]) --> Q1{Onde falhou?}

    Q1 -->|pdf-lib ou upload| F1{Linha em<br/>certificates?}
    F1 -->|sim| F1R["pdf_url = NULL<br/>Caso 5b na próxima chamada<br/>cliente retentar"]
    F1 -->|não| F1N["Sem linha criada<br/>Caso 5c na próxima chamada"]

    Q1 -->|UPDATE pdf_url falhou| F2["pdf_url = NULL<br/>Ficheiro existe no Storage<br/>upsert: true sobrescreve sem erro<br/>Caso 5b na próxima chamada"]

    Q1 -->|send-notification| F3["Warning logado<br/>Aluno recebe downloadUrl<br/>Sem notificação in-app<br/>Aceitável em v1.0"]

    Q1 -->|race condition INSERT| F4["23505 capturado<br/>Relê linha vencedora<br/>Retorna idempotente"]

    Q1 -->|progresso inconsistente| F5{Progresso < 90%?}
    F5 -->|sim - falso negativo| F5A["400 ao cliente<br/>Aguardar FDD-005<br/>sincronizar user_progress"]
    F5 -->|não| F5B["Fluxo normal<br/>sem impacto"]

    Q1 -->|CPU ou memória| F6["500 ao cliente<br/>pdf_url = NULL<br/>Verificar plano Pro<br/>Risco C1"]

    Q1 -->|JWT inválido| F7["401 ao cliente<br/>Re-autenticar"]

    Q1 -->|produto ou perfil ausente| F8["404 ao cliente<br/>Verificar dados"]
```

**Notas**:
- O design de idempotência garante que todos os cenários com `pdf_url = NULL` se auto-resolvem na próxima chamada do cliente, sem necessidade de job manual em v1.0
- O Risco C2 do FDD prevê um job de reconciliação periódico para detectar linhas com `pdf_url = NULL` permanentes (ex: cliente nunca retentou)
- Falha por CPU/memória (Risco C1) pode indicar necessidade de migrar para plano Pro; a feature deve ser desabilitada por flag enquanto não validado em staging com plano equivalente
- Progresso inconsistente (Risco C6) é mitigado pelo contrato explícito com FDD-005; em emergência, a Edge Function pode ser configurada para recalcular, comprometendo temporariamente a regra de não recálculo
