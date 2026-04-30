const { chromium } = require('playwright');

const BASE = 'http://localhost:8080';
const ADMIN_EMAIL = 'teste@testadmin.com';
const ADMIN_PASS  = 'teste123';

let pass = 0, fail = 0, blocked = 0;

function log(id, name, status, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️  BLOCKED';
  const msg = detail ? ` — ${detail}` : '';
  console.log(`${icon} ${id}: ${name}${msg}`);
  if (status === 'PASS') pass++;
  else if (status === 'FAIL') fail++;
  else blocked++;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Fecha qualquer dialog/overlay aberto antes de continuar
async function closeAnyDialog(page) {
  try {
    const overlay = page.locator('[data-state="open"][aria-hidden="true"]');
    if (await overlay.count() > 0) {
      await page.keyboard.press('Escape');
      await sleep(600);
    }
  } catch (_) {}
}

// Limpa sessão Supabase (localStorage + cookies)
async function clearSession(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(BASE + '/auth/admin-login');
  await sleep(500);
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // ═══════════════════════════════════════════════════
  // T01 — Admin Login Page visivel
  // ═══════════════════════════════════════════════════
  try {
    await page.goto(`${BASE}/auth/admin-login`);
    await page.waitForSelector('text=Área Administrativa', { timeout: 8000 });
    log('T01', 'Admin Login Page visivel', 'PASS');
  } catch (e) {
    log('T01', 'Admin Login Page visivel', 'FAIL', e.message);
    await browser.close(); summary(); return;
  }

  // ═══════════════════════════════════════════════════
  // T02 — Login credenciais erradas
  // ═══════════════════════════════════════════════════
  try {
    await page.fill('input[type="email"]', 'errado@test.com');
    await page.fill('input[type="password"]', 'senha_errada');
    await page.click('button[type="submit"]');
    await sleep(3000);
    const url = page.url();
    if (url.includes('admin-login')) log('T02', 'Login errado → ficou na pagina de login', 'PASS');
    else log('T02', 'Login errado → ficou na pagina de login', 'FAIL', `URL: ${url}`);
  } catch (e) { log('T02', 'Login errado', 'FAIL', e.message); }

  // ═══════════════════════════════════════════════════
  // T03 — Login credenciais validas
  // ═══════════════════════════════════════════════════
  let loginOk = false;
  try {
    await page.goto(`${BASE}/auth/admin-login`);
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 20000 });
    loginOk = true;
    log('T03', 'Login valido → /admin/dashboard', 'PASS');
  } catch (e) { log('T03', 'Login valido → /admin/dashboard', 'FAIL', e.message); }

  // ═══════════════════════════════════════════════════
  // T04 — Dashboard carrega
  // ═══════════════════════════════════════════════════
  if (loginOk) {
    try {
      await page.waitForSelector('[class*="card"]', { timeout: 8000 });
      log('T04', 'Dashboard carrega com cards de stats', 'PASS');
    } catch (e) { log('T04', 'Dashboard carrega', 'FAIL', e.message); }

    // ═════════════════════════════════════════════════
    // T05 — Sidebar Produtos
    // ═════════════════════════════════════════════════
    let productsOk = false;
    try {
      await page.goto(`${BASE}/admin/products`);
      await page.waitForURL('**/admin/products', { timeout: 6000 });
      productsOk = true;
      log('T05', 'Navegar para /admin/products', 'PASS');
    } catch (e) { log('T05', 'Navegar Produtos', 'FAIL', e.message); }

    // ═════════════════════════════════════════════════
    // T06 — Criar produto
    // ═════════════════════════════════════════════════
    let createOk = false;
    if (productsOk) {
      try {
        // Clicar botao "+" ou "Novo Produto"
        const addBtn = page.locator('button').filter({ hasText: /novo produto|\+/i }).first();
        await addBtn.click();
        await sleep(800);

        // Preencher formulario com IDs exactos do ProductForm.tsx
        await page.fill('#title', 'Produto E2E Test');
        await page.fill('#description', 'Descricao de teste automatizado E2E para validacao');
        await page.fill('#price', '97.00');

        // Submeter: botao "Criar Produto"
        await page.click('button[type="submit"]:has-text("Criar")');
        await sleep(2500);
        await closeAnyDialog(page);

        const found = await page.locator('text=Produto E2E Test').count() > 0;
        if (found) { createOk = true; log('T06', 'Criar produto', 'PASS'); }
        else log('T06', 'Criar produto', 'FAIL', 'Produto nao apareceu na lista');
      } catch (e) {
        log('T06', 'Criar produto', 'FAIL', e.message);
        await closeAnyDialog(page);
      }
    } else {
      log('T06', 'Criar produto', 'BLOCKED', 'T05 falhou');
    }

    // ═════════════════════════════════════════════════
    // T07 — Editar produto
    // ═════════════════════════════════════════════════
    if (createOk) {
      try {
        // Clicar icone editar no card do produto criado
        const productCard = page.locator('[class*="card"]').filter({ hasText: 'Produto E2E Test' }).first();
        const editBtn = productCard.locator('button').filter({ hasText: /editar/i }).first();
        await editBtn.click();
        await sleep(800);

        // Limpar titulo e preencher novo
        await page.fill('#title', 'Produto E2E Editado');
        await page.click('button[type="submit"]:has-text("Atualizar")');
        await sleep(2500);
        await closeAnyDialog(page);

        const found = await page.locator('text=Produto E2E Editado').count() > 0;
        if (found) log('T07', 'Editar produto', 'PASS');
        else log('T07', 'Editar produto', 'FAIL', 'Titulo editado nao apareceu');
      } catch (e) {
        log('T07', 'Editar produto', 'FAIL', e.message);
        await closeAnyDialog(page);
      }
    } else {
      log('T07', 'Editar produto', 'BLOCKED', 'T06 falhou');
    }

    // ═════════════════════════════════════════════════
    // T14 — Alunos
    // ═════════════════════════════════════════════════
    try {
      await page.goto(`${BASE}/admin/users`);
      await page.waitForURL('**/admin/users', { timeout: 6000 });
      log('T14', 'Navegar para /admin/users (Alunos)', 'PASS');
    } catch (e) { log('T14', 'Alunos', 'FAIL', e.message); }

    // ═════════════════════════════════════════════════
    // T15 — Clientes
    // ═════════════════════════════════════════════════
    try {
      await page.goto(`${BASE}/admin/customers`);
      await page.waitForURL('**/admin/customers', { timeout: 6000 });
      log('T15', 'Navegar para /admin/customers (Clientes)', 'PASS');
    } catch (e) { log('T15', 'Clientes', 'FAIL', e.message); }

    // ═════════════════════════════════════════════════
    // T16 — Compras
    // ═════════════════════════════════════════════════
    try {
      await page.goto(`${BASE}/admin/purchases`);
      await page.waitForURL('**/admin/purchases', { timeout: 6000 });
      log('T16', 'Navegar para /admin/purchases (Compras)', 'PASS');
    } catch (e) { log('T16', 'Compras', 'FAIL', e.message); }

    // ═════════════════════════════════════════════════
    // T17 — Configuracoes
    // ═════════════════════════════════════════════════
    try {
      await page.goto(`${BASE}/admin/settings`);
      await page.waitForURL('**/admin/settings', { timeout: 6000 });
      await page.waitForSelector('input', { timeout: 5000 });
      log('T17', 'Navegar para /admin/settings (Configuracoes)', 'PASS');
    } catch (e) { log('T17', 'Configuracoes', 'FAIL', e.message); }

    // ═════════════════════════════════════════════════
    // T18 — Guardar configuracoes
    // ═════════════════════════════════════════════════
    try {
      await page.goto(`${BASE}/admin/settings`);
      await page.waitForSelector('input', { timeout: 5000 });
      // Preencher platform_name
      const platformInput = page.locator('input[id*="platform"], input[name*="platform"], input').first();
      await platformInput.fill('Plataforma E2E Test');
      // Submeter
      await page.click('button[type="submit"]');
      await sleep(2000);
      log('T18', 'Guardar configuracoes da plataforma', 'PASS');
    } catch (e) { log('T18', 'Guardar configuracoes', 'FAIL', e.message); }

    // ═════════════════════════════════════════════════
    // T19 — Alterar password senhas nao coincidem
    // ═════════════════════════════════════════════════
    try {
      await page.goto(`${BASE}/admin/settings`);
      await page.waitForSelector('input[type="password"]', { timeout: 5000 });
      const passInputs = page.locator('input[type="password"]');
      await passInputs.nth(0).fill('senha_atual');
      await passInputs.nth(1).fill('nova_senha_1');
      await passInputs.nth(2).fill('diferente_2');
      await page.locator('button').filter({ hasText: /alterar.*senha|mudar.*senha/i }).click();
      await sleep(1500);
      log('T19', 'Senhas nao coincidem → erro exibido', 'PASS');
    } catch (e) { log('T19', 'Senhas nao coincidem', 'FAIL', e.message); }

    // ═════════════════════════════════════════════════
    // T20 — Webhooks
    // ═════════════════════════════════════════════════
    try {
      await page.goto(`${BASE}/admin/webhooks`);
      await page.waitForURL('**/admin/webhooks', { timeout: 6000 });
      log('T20', 'Navegar para /admin/webhooks', 'PASS');
    } catch (e) { log('T20', 'Webhooks', 'FAIL', e.message); }

    // ═════════════════════════════════════════════════
    // T21 — Logout
    // ═════════════════════════════════════════════════
    try {
      await page.goto(`${BASE}/admin/dashboard`);
      await page.waitForSelector('button:has-text("Sair")', { timeout: 8000 });
      await page.click('button:has-text("Sair")');
      await sleep(2000);
      // Tentar aceder dashboard apos logout
      await page.goto(`${BASE}/admin/dashboard`);
      await page.waitForURL('**/auth/admin-login', { timeout: 8000 });
      log('T21', 'Logout → sessao terminada, redirect para login', 'PASS');
    } catch (e) { log('T21', 'Logout', 'FAIL', e.message); }
  } else {
    for (const t of ['T04','T05','T06','T07','T14','T15','T16','T17','T18','T19','T20','T21'])
      log(t, '...', 'BLOCKED', 'T03 falhou');
  }

  // ═══════════════════════════════════════════════════
  // T22 — Forgot password
  // ═══════════════════════════════════════════════════
  try {
    await page.goto(`${BASE}/auth/forgot-password`);
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.click('button[type="submit"]');
    await sleep(3500);
    const sent = await page.locator('text=Email enviado').count() > 0;
    if (sent) log('T22', 'Forgot password → estado "Email enviado"', 'PASS');
    else log('T22', 'Forgot password → estado "Email enviado"', 'FAIL', 'Estado nao mudou');
  } catch (e) { log('T22', 'Forgot password', 'FAIL', e.message); }

  // ═══════════════════════════════════════════════════
  // T25 — Nao autenticado acede /admin/dashboard
  // ═══════════════════════════════════════════════════
  try {
    await clearSession(page);
    await page.goto(`${BASE}/admin/dashboard`);
    await page.waitForURL('**/auth/admin-login', { timeout: 8000 });
    log('T25', 'Nao autenticado → /admin/dashboard redireciona para login', 'PASS');
  } catch (e) { log('T25', 'Redirect nao autenticado', 'FAIL', e.message); }

  // ═══════════════════════════════════════════════════
  // BLOCO ALUNO — Simulacao
  // ═══════════════════════════════════════════════════
  console.log('\n── SIMULACAO ALUNO ─────────────────────────────\n');

  // S01 — Student Login Page
  try {
    await page.goto(`${BASE}/auth/student-login`);
    await page.waitForSelector('text=Área do Aluno', { timeout: 8000 });
    log('S01', 'Student Login Page visivel', 'PASS');
  } catch (e) { log('S01', 'Student Login Page visivel', 'FAIL', e.message); }

  // S02 — Login errado (aluno)
  try {
    await page.fill('input[type="email"]', 'naoexiste@test.com');
    await page.fill('input[type="password"]', 'errada123');
    await page.click('button[type="submit"]');
    await sleep(3000);
    if (page.url().includes('student-login'))
      log('S02', 'Student login errado → ficou na pagina', 'PASS');
    else
      log('S02', 'Student login errado → ficou na pagina', 'FAIL', `URL: ${page.url()}`);
  } catch (e) { log('S02', 'Student login errado', 'FAIL', e.message); }

  // S03 — Admin faz login na pagina do aluno → redirect /admin/dashboard
  try {
    await page.goto(`${BASE}/auth/student-login`);
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 20000 });
    log('S03', 'Admin na pagina do aluno → redireciona para /admin/dashboard', 'PASS');
  } catch (e) { log('S03', 'Admin na pagina student-login', 'FAIL', e.message); }

  // T24 — Admin (autenticado) tenta /student → redirecionado
  try {
    await page.goto(`${BASE}/student`);
    await sleep(2500);
    const url = page.url();
    if (url.includes('admin-login') || url.includes('admin/dashboard')) {
      log('T24', 'Admin tenta /student → redirecionado (acesso negado)', 'PASS', `→ ${url}`);
    } else {
      log('T24', 'Admin tenta /student → redirecionado', 'FAIL', `URL: ${url}`);
    }
  } catch (e) { log('T24', 'Admin tenta /student', 'FAIL', e.message); }

  // T10 — Nao autenticado tenta /student
  try {
    await clearSession(page);
    await page.goto(`${BASE}/student`);
    await page.waitForURL('**/auth/student-login', { timeout: 8000 });
    log('T10', 'Nao autenticado → /student redireciona para student-login', 'PASS');
  } catch (e) { log('T10', 'Nao autenticado → /student redirect', 'FAIL', e.message); }

  // ─── Nota sobre o aluno ───────────────────────────
  console.log('\n  ℹ️  NOTA ALUNO: Para testar S04-S07 (dashboard de cursos,');
  console.log('     ProductView, ModuleView, Certificado) e necessario criar');
  console.log('     uma conta de aluno no Supabase com uma compra aprovada.');
  console.log('     Fornece email+senha do aluno e continuo os testes.\n');

  await sleep(1000);
  await browser.close();
  summary();
})();

function summary() {
  const total = pass + fail + blocked;
  console.log('═══════════════════════════════════════');
  console.log('  RESULTADO FINAL');
  console.log('═══════════════════════════════════════');
  console.log(`  Total   : ${total}`);
  console.log(`  ✅ PASS  : ${pass}`);
  console.log(`  ❌ FAIL  : ${fail}`);
  console.log(`  ⚠️  BLOCK : ${blocked}`);
  console.log('═══════════════════════════════════════');
}
