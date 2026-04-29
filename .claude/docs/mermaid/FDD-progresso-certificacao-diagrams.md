# Diagramas Mermaid — Sistema de Progresso e Certificação (FDD-005)

## Visão Geral

O FDD-005 define a evolução do sistema de progresso e certificação do APP XPRO para v1.0 funcional. O sistema regista progresso real de vídeo através da YouTube IFrame Player API (polling de 10 s em `PLAYING`, persist imediato em `PAUSED`, `ENDED` e unmount), mantém marcação binária para PDF e texto via botão explícito, e centraliza toda a agregação numa view SQL canónica `v_user_product_progress`. A monotonicidade de `progress_percentage` e `completed` é garantida por um trigger `BEFORE UPDATE` no servidor, eliminando regressões por seek-back ou concorrência entre abas. O certificado é disparado client-driven: a UI lê a view e, quando `progress_percentage >= 90` e não existe certificado, disponibiliza o botão ao aluno.

## Elementos Identificados

### Fluxos externos

- Aluno consome módulo de vídeo (YouTube embed via `YT.Player`)
- Aluno consome módulo PDF ou texto (botão "Marcar como concluído")
- Aluno clica "Gerar certificado" (chama `useGenerateCertificate` — FDD-004)
- Edge Function `generate-certificate` lê `v_user_product_progress` (FDD-004 §5.2)

### Processos internos

- Hook `useVideoProgress`: singleton da YouTube IFrame Player API, polling com `setInterval`, persist via `progressService.upsert`
- Hook `useMarkModuleComplete`: mutação que chama `progressService.markComplete`
- `progressService.upsert`: UPSERT atómico com `onConflict: 'user_id,module_id'`
- Trigger SQL `user_progress_monotonic_progress`: aplica `GREATEST` em `progress_percentage` e `OR` em `completed`
- View SQL `v_user_product_progress`: duas CTEs — `product_module_counts` e `user_progress_by_product`
- TanStack Query: invalida chaves `progress.byUserAndProduct` e `progress.byUserAndProductModules` após cada persist
- `useUserProductProgress`: refetch da view após invalidação

### Variações de comportamento

- Tipo de módulo `video`: progresso real (`min(100, round(position/duration*100))`), sentinel de conclusão em 95%
- Tipo de módulo `pdf`: progresso binário 0/100, conclusão por acção explícita
- Tipo de módulo `text`: progresso binário 0/100, conclusão por acção explícita
- Tipo de módulo `quiz`: fora de âmbito v1.0
- Trigger `beforeunload` + `navigator.sendBeacon`: fora de âmbito v1.0 (alvo v1.x)
- Trigger SQL automático via `pg_net`: fora de âmbito v1.0 (alvo v2.0)

### Contratos públicos

- `UserProgress`: tipo derivado de `Database['public']['Tables']['user_progress']['Row']`
- `UserProgressInsert` / `UserProgressUpdate`: tipos de mutação correspondentes
- `UserProductProgress`: interface manual com campos `user_id`, `product_id`, `modules_total`, `modules_completed`, `progress_percentage`, `completed_at`
- `progressService`: métodos `upsert`, `markComplete`, `getByUserAndProduct`, `listModuleProgressByProduct`
- Chaves TanStack Query: `['progress', 'product', userId, productId]` e `['progress', 'modules', userId, productId]`

---

## Diagramas

### Fluxo Principal End-to-End

Este diagrama de sequência representa o fluxo completo desde o consumo de um módulo pelo aluno até à actualização da interface, cobrindo tanto o caminho do vídeo como o do PDF/texto. Mostra como o `progressService` é o único ponto de escrita no sistema, como o trigger de monotonicidade actua no servidor antes do commit, e como o TanStack Query orquestra a invalidação e o refetch da view canónica. A compreensão deste fluxo é essencial porque clarifica a separação entre a camada de hook específica do tipo de módulo e a camada de serviço genérica abaixo dela.

```mermaid
sequenceDiagram
    participant A as Aluno
    participant HV as useVideoProgress
    participant HM as useMarkModuleComplete
    participant PS as progressService
    participant DB as "user_progress (DB)"
    participant TR as "Trigger Monotónico"
    participant TQ as TanStack Query
    participant VI as "v_user_product_progress"
    participant UI as "UI (Certificate)"

    alt Módulo de vídeo
        A->>HV: PLAYING / PAUSED / ENDED / unmount
        HV->>PS: upsert(userId, moduleId, pct, position)
    else PDF ou texto
        A->>HM: clica "Marcar concluído"
        HM->>PS: markComplete(userId, moduleId)
    end

    PS->>DB: INSERT ... ON CONFLICT DO UPDATE
    DB->>TR: BEFORE UPDATE
    TR-->>DB: GREATEST(new, old) aplicado
    DB-->>PS: linha actualizada

    PS-->>TQ: invalidateQueries(progress.byUserAndProduct)
    TQ->>VI: SELECT * WHERE user_id AND product_id
    VI-->>TQ: progress_percentage, modules_completed
    TQ-->>UI: dados actualizados

    alt progress_percentage >= 90 e sem certificado
        UI->>A: mostra botão "Gerar certificado"
    else progress_percentage < 90
        UI->>A: mostra barra de progresso
    end
```

**Notas**:
- `progressService` é o único caminho do frontend para escrever em `user_progress`; páginas não chamam `supabase.from('user_progress')` directamente.
- O trigger `user_progress_monotonic_progress` actua `BEFORE UPDATE`; o cliente pode enviar um valor de `progress_percentage` menor (por seek-back) sem risco de regressão.
- `staleTime: 0` em `useUserProductProgress` garante que cada invalidação desencadeia um refetch imediato da view.

---

### Máquina de Estados do Player de Vídeo (YouTube IFrame Player API)

Este diagrama de estados representa o ciclo de vida do `useVideoProgress` em resposta aos eventos da YouTube IFrame Player API. É um dos elementos mais não-óbvios do sistema porque a API não emite `timeupdate` como o HTML5 e a estratégia de polling precisa de ser suspensa e retomada em função do estado do player. Cada transição de estado inclui a acção de persist ou de polling associada, tornando claro quando o progresso é persistido e quando é apenas acumulado.

```mermaid
stateDiagram-v2
    [*] --> Inactivo : useEffect monta

    Inactivo --> APICarregando : loadYouTubeApi()

    APICarregando --> PlayerReady : onReady
    APICarregando --> ErroAPI : script bloqueado

    ErroAPI --> [*] : tracking desabilitado

    PlayerReady --> PLAYING : onStateChange(1)
    PlayerReady --> BUFFERING : onStateChange(3)

    PLAYING --> BUFFERING : onStateChange(3)
    PLAYING --> PAUSED : onStateChange(2)
    PLAYING --> ENDED : onStateChange(0)
    PLAYING --> Cleanup : unmount

    BUFFERING --> PLAYING : onStateChange(1)
    BUFFERING --> Cleanup : unmount

    PAUSED --> PLAYING : onStateChange(1)
    PAUSED --> Cleanup : unmount

    ENDED --> [*] : persist(forceComplete=true)

    Cleanup --> [*] : clearInterval + persist() + destroy()

    note right of PLAYING
        setInterval persist()
        a cada 10 s
    end note

    note right of PAUSED
        clearInterval
        persist() imediato
    end note

    note right of ENDED
        clearInterval
        progress=100
        completed=true
    end note

    note right of Cleanup
        clearInterval
        persist() imediato
        player.destroy()
    end note
```

**Notas**:
- `BUFFERING` (estado 3) mantém o intervalo activo porque é um glitch de rede, não uma pausa de utilizador.
- `ENDED` (estado 0) força `completed=true` e `progress_percentage=100` independentemente da posição real.
- O estado `Cleanup` representa o caminho de unmount do `useEffect`; pode ocorrer a partir de qualquer estado activo (`PLAYING`, `BUFFERING`, `PAUSED`).
- `loadYouTubeApi()` é um singleton por sessão de browser: a primeira instância do hook injecta o script; instâncias subsequentes esperam a mesma promise.
- `player.destroy()` é envolto em `try/catch` no unmount porque a API pode lançar excepção se chamada antes de o player estar `READY`.

---

### Dependências da View SQL `v_user_product_progress`

Este diagrama de fluxo representa a estrutura interna da view canónica `v_user_product_progress`, mostrando as duas CTEs intermediárias e como se combinam para produzir o `progress_percentage` por `(user_id, product_id)`. É um diagrama arquitecturalmente relevante porque esta view é a fonte de verdade única consumida pela UI, pela Edge Function `generate-certificate`, e pelo admin dashboard — e a sua lógica de agregação nunca deve ser replicada inline. O diagrama torna visível o caminho de dados desde as tabelas base até à coluna `progress_percentage` que aciona o certificado.

```mermaid
flowchart TD
    M["modules<br/>(product_id, id)"]
    UP["user_progress<br/>(user_id, module_id, completed, completed_at)"]

    CTE1["CTE: product_module_counts<br/>COUNT(*) por product_id"]
    CTE2["CTE: user_progress_by_product<br/>COUNT(completed) e MAX(completed_at)<br/>por (user_id, product_id)"]

    JOIN["JOIN final<br/>(user_id, product_id)"]

    CASE["CASE: modules_total = 0<br/>→ 0<br/>senão ROUND(100 * completed / total)"]

    VIEW["v_user_product_progress<br/>user_id, product_id<br/>modules_total, modules_completed<br/>progress_percentage, completed_at"]

    M --> CTE1
    M --> CTE2
    UP --> CTE2

    CTE1 --> JOIN
    CTE2 --> JOIN

    JOIN --> CASE
    CASE --> VIEW

    SI["security_invoker = on<br/>RLS do utilizador aplica-se"]
    VIEW --- SI
```

**Notas**:
- `security_invoker = on` força a view a correr com a role do utilizador autenticado; a RLS de `user_progress` (`auth.uid() = user_id`) filtra automaticamente as linhas.
- A CTE `product_module_counts` conta todos os módulos do produto, incluindo módulos que o aluno ainda não iniciou.
- O `CASE` protege contra divisão por zero quando `modules_total = 0` (produto sem módulos retorna `progress_percentage = 0`; certificado nunca elegível).
- Quando um módulo é apagado após o aluno o ter concluído, `modules_total` reduz e `progress_percentage` recalcula automaticamente na próxima leitura da view.

---

### Granularidade por Tipo de Módulo

Este diagrama de fluxo compara lado a lado o tratamento de progresso para os três tipos de módulo activos em v1.0: vídeo, PDF e texto. A comparação é necessária porque a granularidade e os mecanismos de conclusão diferem significativamente entre tipos, e o diagrama torna explícita a decisão de que apenas vídeo beneficia de progresso contínuo enquanto PDF e texto mantêm semântica binária. O tipo `quiz` está declarado no enum mas fora de âmbito neste FDD e não aparece neste diagrama.

```mermaid
flowchart LR
    subgraph "Vídeo (YouTube embed)"
        V1["YT.Player monta<br/>em div container"]
        V2["Polling 10 s<br/>em PLAYING"]
        V3["persist():<br/>position / duration"]
        V4{"pct >= 95%<br/>ou ENDED?"}
        V5["completed = true<br/>progress = 100"]
        V6["progress = pct<br/>last_position = position"]

        V1 --> V2
        V2 --> V3
        V3 --> V4
        V4 -->|sim| V5
        V4 -->|não| V6
    end

    subgraph "PDF / Texto (binário)"
        P1["Aluno visualiza<br/>conteúdo"]
        P2["Botão: Marcar<br/>como concluído"]
        P3["markComplete():<br/>progress = 100"]
        P4["completed = true<br/>last_position = 0"]

        P1 --> P2
        P2 --> P3
        P3 --> P4
    end

    V5 --> U["progressService.upsert<br/>UPSERT atómico"]
    V6 --> U
    P4 --> U
```

**Notas**:
- O sentinel de 95% para vídeo cobre o caso comum de aluno que não vê os últimos segundos (créditos, agradecimentos).
- PDF e texto não escrevem em `last_position_seconds` (mantém 0); a funcionalidade "continuar de onde parei" é exclusiva de vídeo.
- A flag `completed` no agregado do produto é binária para todos os tipos: o que varia é como cada tipo a atinge.
- Ambos os caminhos convergem no mesmo `progressService.upsert`, garantindo que a lógica de UPSERT e monotonicidade é partilhada.

---

### UPSERT Atómico e Trigger de Monotonicidade

Este diagrama representa o fluxo de escrita em `user_progress` desde a chamada do `progressService` até ao commit, incluindo a actuação do trigger de monotonicidade. É crítico para compreender como o sistema resolve dois problemas simultâneos: a race condition entre duas abas abertas para o mesmo módulo (resolvida pelo UPSERT atómico) e a regressão de progresso por seek-back (resolvida pelo trigger `BEFORE UPDATE`). Sem este diagrama, a garantia de monotonicidade seria apenas texto e dificilmente comunicável a quem implementa ou revê o código.

```mermaid
flowchart TD
    INPUT["Chamada progressService.upsert<br/>userId, moduleId, pct, position, completed"]

    UPSERT["Supabase JS: .upsert()<br/>onConflict: user_id, module_id"]

    DEC{"Linha existe?"}

    INSERT["INSERT nova linha<br/>(sem trigger BEFORE UPDATE)"]

    TRIGGER["Trigger BEFORE UPDATE<br/>user_progress_monotonic_progress"]

    MONO1["NEW.progress_percentage =<br/>GREATEST(NEW, OLD)"]
    MONO2["NEW.completed =<br/>NEW.completed OR OLD.completed"]
    MONO3{"NEW.completed e<br/>OLD.completed_at not null?"}
    MONO4["NEW.completed_at =<br/>OLD.completed_at"]
    MONO5["NEW.completed_at<br/>mantém novo valor"]

    COMMIT["COMMIT<br/>linha actualizada"]

    INVALIDATE["TanStack Query invalida<br/>progress.byUserAndProduct"]

    INPUT --> UPSERT
    UPSERT --> DEC
    DEC -->|não existe| INSERT
    DEC -->|existe| TRIGGER
    INSERT --> COMMIT

    TRIGGER --> MONO1
    MONO1 --> MONO2
    MONO2 --> MONO3
    MONO3 -->|sim| MONO4
    MONO3 -->|não| MONO5
    MONO4 --> COMMIT
    MONO5 --> COMMIT

    COMMIT --> INVALIDATE
```

**Notas**:
- `last_position_seconds` não é protegido pelo trigger e pode decrescer livremente: representa a posição actual do aluno, não o máximo já visto.
- `completed = true` é sticky: uma vez marcado, o trigger `OR` impede que volte a `false` mesmo que o cliente envie `completed=false`.
- `completed_at` preserva o timestamp original da primeira conclusão; se o módulo for concluído de novo (idempotente), a data não muda.
- O `UPSERT` com `onConflict` substitui o padrão anterior de SELECT + UPDATE/INSERT manual, eliminando a race condition entre verificar e escrever.

---

### Disparo Client-Driven do Certificado

Este diagrama de sequência representa o fluxo específico de verificação de elegibilidade e disparo do certificado, que é separado do fluxo de persist de progresso. É um diagrama relevante porque a lógica client-driven em v1.0 é uma decisão arquitectural consciente (sem `pg_net`, sem trigger automático) e o fluxo envolve dois hooks distintos (`useUserProductProgress` e `useCertificate`) que precisam de ser consultados em conjunto para determinar o estado da UI. O diagrama também deixa claro que a geração do PDF é responsabilidade da Edge Function `generate-certificate` (FDD-004).

```mermaid
sequenceDiagram
    participant A as Aluno
    participant UI as "Certificate.tsx"
    participant UPP as useUserProductProgress
    participant UC as useCertificate
    participant UGC as useGenerateCertificate
    participant VI as "v_user_product_progress"
    participant EF as "generate-certificate<br/>(Edge Function)"
    participant CB as "certificates (DB)"

    UI->>UPP: useUserProductProgress(userId, productId)
    UPP->>VI: SELECT progress_percentage
    VI-->>UPP: progress_percentage

    UI->>UC: useCertificate(userId, productId)
    UC-->>UI: certificate (null ou existente)

    alt progress_percentage >= 90 e certificate null
        UI->>A: mostra botão "Gerar certificado"
        A->>UGC: clica botão
        UGC->>EF: mutate(productId)
        EF->>VI: lê progress_percentage (validação)
        EF->>CB: INSERT certificado + gera PDF
        CB-->>EF: pdf_url
        EF-->>UGC: ok
        UGC-->>UI: invalida useCertificate
        UI->>A: mostra botão "Baixar certificado"
    else progress_percentage < 90
        UI->>A: mostra empty state
    else certificate existente
        UI->>A: mostra botão "Baixar"
    end
```

**Notas**:
- A view `v_user_product_progress` é consultada tanto pela UI (para verificar elegibilidade) como pela Edge Function `generate-certificate` (para validação interna antes de emitir o PDF).
- O threshold de elegibilidade para o certificado é `progress_percentage >= 90` (90% dos módulos com `completed=true`), diferente do sentinel de conclusão de vídeo (95%).
- Em v2.0, o trigger SQL via `pg_net` substituirá este fluxo client-driven, emitindo o certificado automaticamente quando o aluno atingir 90%.
- O aluno controla o momento de emissão em v1.0, permitindo que reveja o conteúdo antes de gerar o certificado.

---

### Segurança da View: RLS e `security_invoker`

Este diagrama representa como as camadas de segurança se combinam para garantir que cada utilizador (aluno ou admin) acede apenas ao progresso a que tem direito. A relevância deste diagrama justifica-se pelo Risco P6 (vazamento entre alunos por ausência de `security_invoker`) e P7 (vazamento entre admins por policy mal escrita) identificados no FDD. O diagrama torna explícito o mecanismo pelo qual a view herda a RLS do utilizador autenticado e como a policy `admins_read_product_progress` alarga o acesso de forma segura para admins.

```mermaid
flowchart TD
    QUERY["SELECT v_user_product_progress<br/>(aluno ou admin)"]

    SI{"security_invoker = on<br/>activo?"}

    ROLE{"Role do chamador"}

    RLS_USER["RLS user_progress:<br/>auth.uid() = user_id<br/>→ apenas linhas próprias"]

    POLICY_ADMIN["Policy admins_read_product_progress:<br/>EXISTS módulo no produto<br/>com admin_id = auth.uid()"]

    FILTER_USER["Retorna apenas progresso<br/>do aluno autenticado"]

    FILTER_ADMIN["Retorna progresso de alunos<br/>dos produtos do admin"]

    GRANT["GRANT SELECT<br/>TO authenticated"]

    RISCO["RISCO CRÍTICO:<br/>todos os alunos veêm<br/>progresso de todos"]

    QUERY --> SI
    SI -->|sim| ROLE
    SI -->|não| RISCO

    ROLE -->|aluno| RLS_USER
    ROLE -->|admin| POLICY_ADMIN

    RLS_USER --> FILTER_USER
    POLICY_ADMIN --> FILTER_ADMIN

    GRANT -.->|pré-condição| QUERY
```

**Notas**:
- `security_invoker = on` faz com que a view execute com a role do utilizador autenticado, não com a role do owner da view; sem este flag, a RLS de `user_progress` seria ignorada.
- A policy `admins_read_product_progress` usa `EXISTS` com JOIN em `modules` e `products` filtrando `p.admin_id = auth.uid()`, impedindo que admin A veja progresso de produtos de admin B.
- A view herda automaticamente a policy adicional via `security_invoker`: não é necessário duplicar a lógica de segurança na view.
- A validação manual com duas contas de aluno e duas contas de admin em staging é pré-condição de deploy (§9.2 PR 1 e PR 6).

---

### Tratamento de Erros no Player de Vídeo

Este diagrama representa os cenários de falha mais relevantes no ciclo de vida do `useVideoProgress` e o comportamento do sistema em cada caso. É um diagrama necessário porque os erros no contexto da YouTube IFrame Player API são silenciosos por design (não interrompem o playback) e o seu tratamento é não-óbvio para quem mantém o código. O diagrama cobre os cenários identificados na secção §6.1 do FDD que têm impacto de nível médio ou superior.

```mermaid
flowchart TD
    START["useVideoProgress monta"]

    LOAD["loadYouTubeApi()"]

    ERR_NET{"Script bloqueado<br/>(rede/firewall)?"}

    ERR_DISABLED["Tracking desabilitado<br/>silenciosamente<br/>UI mostra vídeo sem tracking"]

    PLAYER["YT.Player instanciado"]

    PERSIST["persist() chamado"]

    ERR_DUR{"getDuration() = 0<br/>ou Infinity?"}

    ERR_IGNORE["persist ignorado<br/>próximo polling tenta"]

    ERR_VID{"videoId vazio<br/>(URL malformada)?"}

    ERR_SKIP["useEffect early-return<br/>player não construído"]

    ERR_NET2{"Falha de rede<br/>no UPSERT?"}

    WARN["console.warn<br/>próximo intervalo retenta<br/>(polling) ou aluno perde<br/>até 10 s (terminal)"]

    OK["persist bem-sucedido<br/>invalidateQueries"]

    START --> LOAD
    LOAD --> ERR_NET
    ERR_NET -->|sim| ERR_DISABLED
    ERR_NET -->|não| ERR_VID

    ERR_VID -->|sim| ERR_SKIP
    ERR_VID -->|não| PLAYER

    PLAYER --> PERSIST
    PERSIST --> ERR_DUR
    ERR_DUR -->|sim| ERR_IGNORE
    ERR_DUR -->|não| ERR_NET2
    ERR_NET2 -->|sim| WARN
    ERR_NET2 -->|não| OK
```

**Notas**:
- Nenhum erro no player interrompe o playback do vídeo; todos são tratados como "tracking silenciosamente degradado".
- A validação `duration > 0 && isFinite(duration)` protege contra leituras antecipadas (player ainda não `READY`); o próximo intervalo de 10 s tentará de novo.
- Quando o aluno fecha a aba bruscamente, o cleanup do `useEffect` pode não correr; v1.0 aceita perda de até 10 s desde o último persist bem-sucedido (Risco P2).
- `videoId` vazio por URL malformada em `module.video_url` resulta em early-return silencioso; nenhum tracking acontece para aquele módulo.
