/* ==========================================================================
   1. CONFIGURAÇÕES GERAIS E VARIÁVEIS GLOBAIS
   ========================================================================== */
// Detecta idioma do navegador do usuário
let idiomaAtual = navigator.language.startsWith('en') ? 'en' : 'pt';

const dicionario = {
    pt: {
        statsPanelTitle: "Info", spawnRatesAndWeights: "Taxas de Aparecimento", advancedSetup: "Configurações Avançadas",
        specialRules: "Regras Especiais", spawnRates: "Taxas de Aparecimento (%)", individualWeights: "Pesos Individuais das Cartas",
        btnStartMatch: "Começar", linkDB: "Zombicide DB", btnHome: "Início", activeDecks: "Decks Ativos",
        appTitle: "Zombicide Spawn", chooseEra: "Escolha o Cenário:", eraClassic: "Clássico / Moderno", eraFantasy: "Fantasia", eraWest: "Velho Oeste",
        configMatch: "Configure a Partida", baseGames: "Base", expansions: "Expansões", btnConfirm: "Confirmar", btnBack: "← Voltar", 
        dangerLevel: "Nível de Perigo:", blue: "Azul", yellow: "Amarelo", orange: "Laranja", red: "Vermelho", btnDraw: "Entrada!",
        resultLabel: "Resultado:", btnBackDecks: "← Escolher Outros Decks", waiting: "Aguardando...", noEnemyData: "Nenhuma regra especial listada.",
        btnAbout: "Sobre", gameMode: "Modo de Jogo:", modeStandard: "Padrão", modeAdvanced: "Avançado", inPlay: "em Jogo", drawn: "Sorteados", currentChance: "Chance Atual",
        lblBase: "Base", lblInc: "Incremento", ruleAbominafest: "Abominafest", tableEnemy: "Inimigo",
        aboutText1: "O Zombicide Spawn é um gerenciador de cartas de aparecimento projetado para otimizar suas partidas.",
        aboutText2: "O algoritmo inteligente calcula as probabilidades de sorteio com base nas cartas físicas das expansões selecionadas. Ele agrupa tipos de inimigos e realiza os sorteios entre cada tipo independentemente, depois entre os inimigos do tipo sorteado e, por fim, a quantidade de inimigos. Ele também conta com um contador que segue a seguinte proporção:",
        aboutText3: "Configure sua partida escolhendo o cenário, mescle as expansões desejadas e controle o nível de perigo com facilidade. Selecione o modo padrão para seguir as regras básicas do manual ou o modo avançado para personalizar as chances dos inimigos individualmente."
    },
    en: {
        statsPanelTitle: "Info", spawnRatesAndWeights: "Spawn Rates", advancedSetup: "Advanced Setup",
        specialRules: "Special Rules", spawnRates: "Spawn Rates (%)", individualWeights: "Individual Card Weights",
        btnStartMatch: "Start", linkDB: "Zombicide DB", btnHome: "Home", activeDecks: "Active Decks",
        appTitle: "Zombicide Spawn", chooseEra: "Choose Setting:", eraClassic: "Classic / Modern", eraFantasy: "Fantasy", eraWest: "Western",
        configMatch: "Setup", baseGames: "Base", expansions: "Expansions", btnConfirm: "Confirm", btnBack: "← Back", 
        dangerLevel: "Danger Level:", blue: "Blue", yellow: "Yellow", orange: "Orange", red: "Red", btnDraw: "Spawn!",
        resultLabel: "Result:", btnBackDecks: "← Choose Other Decks", waiting: "Waiting...", noEnemyData: "No special rules listed.",
        btnAbout: "About", gameMode: "Game Mode:", modeStandard: "Standard", modeAdvanced: "Advanced", inPlay: "in game", drawn: "Spawn", currentChance: "Current Chance",
        lblBase: "Base", lblInc: "Increment", ruleAbominafest: "Abominafest", tableEnemy: "Enemy",
        aboutText1: "Zombicide Spawn is a spawn card manager designed to optimize your matches.",
        aboutText2: "The smart algorithm calculates draw probabilities based on the physical cards of the selected expansions. It groups enemy types and performs draws between each type independently, then among enemies of the drawn type, and finally the amount of enemies. It also features a counter that follows this ratio:",
        aboutText3: "Setup your match by choosing the scenario, merge desired expansions, and easily control the danger level. Select standard mode for basic rulebook rules, or advanced mode to customize individual enemy spawn rates."
    }
};

const configEspeciais = {
    blue:   { abomBase: 0, abomInc: 0.5,   necroBase: 1, necroInc: 0.5 },
    yellow: { abomBase: 1, abomInc: 0.5,   necroBase: 2, necroInc: 1 },
    orange: { abomBase: 2, abomInc: 1,     necroBase: 3, necroInc: 1.5 },
    red:    { abomBase: 3, abomInc: 1,     necroBase: 4, necroInc: 1.5 }
};

// Captura das Telas
const screenTheme = document.getElementById('screen-theme');
const screenExpansion = document.getElementById('screen-expansion');
const screenAdvanced = document.getElementById('screen-advanced');
const screenSpawner = document.getElementById('screen-spawner');
const screenAbout = document.getElementById('screen-about');

// Elementos Dinâmicos e de Sorteio
const listBaseGames = document.getElementById('list-base-games');
const listExpansions = document.getElementById('list-expansions');
const currentExpansionTitle = document.getElementById('current-expansion-title');
const btnConfirmLoad = document.getElementById('btn-confirm-load');
const btnDraw = document.getElementById('btn-draw');
const resultText = document.getElementById('result-text');
const appContainer = document.getElementById('app-container');

// Estado do Jogo (State)
let bancoDeDadosPreCarregado = []; 
let baralhoZumbis = {}; 
let tabelaInimigos = {};
let tabelaAux = {};
let perigoSelecionado = 'blue';
let layoutFantasia = null; 
let bonusAbom = 0, bonusNecro = 0;
let contAbom = 0, contNecro = 0;
let temWhiteDeath = false;


/* ==========================================================================
   2. INICIALIZAÇÃO DO APLICATIVO
   ========================================================================== */
async function inicializarApp() {
    try {
        resultText.textContent = "Carregando banco de dados...";
        let listaArquivosJson = [];
        
        try {
            const resLista = await fetch('sources/deck_list.json');
            if (resLista.ok) {
                const dadosConfig = await resLista.json();
                listaArquivosJson = dadosConfig.files; 
                layoutFantasia = dadosConfig.layout_fantasy; 
            } else throw new Error("Arquivo deck_list.json não encontrado.");
        } catch (e) {
            resultText.textContent = "Erro ao carregar a lista de decks.";
            return; 
        }
        
        const requisicoes = listaArquivosJson.map(async (arq) => {
            try {
                const resposta = await fetch(`sources/${arq}`);
                if (!resposta.ok) return null; 
                return { arquivo: arq, dados: await resposta.json() };
            } catch (e) { return null; }
        });
        
        const resultadosBrutos = await Promise.all(requisicoes);
        bancoDeDadosPreCarregado = resultadosBrutos.filter(item => item !== null);
        
        try {
            const resInimigos = await fetch('sources/enemies.json');
            if (resInimigos.ok) {
                const dados = await resInimigos.json();
                tabelaInimigos = Array.isArray(dados) ? dados.reduce((acc, item) => { acc[item.id] = item; return acc; }, {}) : dados;
            }
        } catch (e) { console.error("Aviso: enemies.json não encontrado."); }

        try {
            const resAux = await fetch('sources/aux.json');
            if (resAux.ok) {
                const dados = await resAux.json();
                tabelaAux = Array.isArray(dados) ? dados.reduce((acc, item) => { acc[item.tags] = item; return acc; }, {}) : dados;
            }
        } catch (e) { console.error("Aviso: aux.json não encontrado."); }

        resultText.textContent = dicionario[idiomaAtual].waiting;
    } catch (erroFatal) {
        console.error("Erro fatal na inicialização:", erroFatal);
    }
}
inicializarApp();


/* ==========================================================================
   3. UTILITÁRIOS E CONTROLE DE INTERFACE (UI)
   ========================================================================== */
function atualizarTextos() {
    document.querySelectorAll('[data-i18n]').forEach(elemento => {
        const chave = elemento.getAttribute('data-i18n');
        if (dicionario[idiomaAtual][chave]) elemento.innerHTML = dicionario[idiomaAtual][chave]; 
    });

    const abomText = tabelaAux['abomination'] ? (idiomaAtual === 'pt' ? tabelaAux['abomination'].tags_pt : tabelaAux['abomination'].tags_en) : 'Abomination';
    const cabalText = tabelaAux['necromancer_cabal'] ? (idiomaAtual === 'pt' ? tabelaAux['necromancer_cabal'].tags_pt : tabelaAux['necromancer_cabal'].tags_en) : 'Necromancer Cabal';
    const txtInPlay = dicionario[idiomaAtual].inPlay;

    // Atualiza Abominação e Cabal normalmente
    if(document.getElementById('label-abom-check')) document.getElementById('label-abom-check').textContent = `${abomText} ${txtInPlay}`;
    if(document.getElementById('label-cabal')) document.getElementById('label-cabal').textContent = cabalText;
    
    // Atualiza os cabeçalhos da Tabela Sobre
    const nomeNecro = tabelaAux['necromancer'] ? (idiomaAtual === 'pt' ? tabelaAux['necromancer'].tags_pt : tabelaAux['necromancer'].tags_en) : 'Necromantes';
    const nomeAbom = tabelaAux['abomination'] ? (idiomaAtual === 'pt' ? tabelaAux['abomination'].tags_pt : tabelaAux['abomination'].tags_en) : 'Abominações';
    if(document.getElementById('about-th-necro')) document.getElementById('about-th-necro').textContent = nomeNecro;
    if(document.getElementById('about-th-abom')) document.getElementById('about-th-abom').textContent = nomeAbom;

    // Para o Necromante/Defiler, chamamos a função oficial de regras (se ela já estiver carregada)
    if (typeof atualizarVisibilidadeCaixas === 'function') {
        atualizarVisibilidadeCaixas();
    }
}

document.getElementById('lang-select').addEventListener('change', (e) => {
    idiomaAtual = e.target.value; 
    atualizarTextos();
    atualizarEstatisticas(); // Atualiza o painel de status imediatamente se o idioma mudar no meio do jogo
});
atualizarTextos();

function mostrarTela(telaAtiva) {
    screenTheme.classList.remove('active');
    screenExpansion.classList.remove('active');
    screenSpawner.classList.remove('active');
    screenAbout.classList.remove('active');
    if (screenAdvanced) screenAdvanced.classList.remove('active');
    telaAtiva.classList.add('active');
}

function triggerFlash() {
    appContainer.classList.add('flash-effect');
    setTimeout(() => { appContainer.classList.remove('flash-effect'); }, 150);
}

// Navegação Superior, Rodapé e Botões de Voltar
document.getElementById('btn-home').addEventListener('click', () => {
    baralhoZumbis = {};
    bonusAbom = 0; bonusNecro = 0; contAbom = 0; contNecro = 0;
    temWhiteDeath = false;
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    btnConfirmLoad.disabled = true;
    document.getElementById('enemy-card').style.display = 'none';
    resultText.textContent = dicionario[idiomaAtual].waiting;
    document.getElementById('current-expansion-title').textContent = dicionario[idiomaAtual].activeDecks;
    mostrarTela(screenTheme);
});

document.getElementById('btn-about').addEventListener('click', () => mostrarTela(screenAbout));
document.getElementById('btn-back-from-about').addEventListener('click', () => mostrarTela(screenTheme));
document.getElementById('btn-db-home').addEventListener('click', () => window.open("https://gflino.github.io/ZBC_DB/", "_blank"));
document.getElementById('btn-back-to-theme').addEventListener('click', () => mostrarTela(screenTheme));
// NOVO: Adicionado o botão de voltar da tela avançada
document.getElementById('btn-back-to-expansions-adv').addEventListener('click', () => mostrarTela(screenExpansion));

// Chave Padrão/Avançado (Com sincronização inicial corrigida)
const gameModeToggle = document.getElementById('game-mode-toggle');
if(gameModeToggle) {
    // 1. Sincroniza a cor ao carregar a página
    if(gameModeToggle.checked) {
        document.getElementById('label-standard').classList.remove('active');
        document.getElementById('label-advanced').classList.add('active');
    } else {
        document.getElementById('label-standard').classList.add('active');
        document.getElementById('label-advanced').classList.remove('active');
    }
    
    // 2. Sincroniza a cor ao clicar
    gameModeToggle.addEventListener('change', (e) => {
        if(e.target.checked) {
            document.getElementById('label-standard').classList.remove('active');
            document.getElementById('label-advanced').classList.add('active');
        } else {
            document.getElementById('label-standard').classList.add('active');
            document.getElementById('label-advanced').classList.remove('active');
        }
    });
}


/* ==========================================================================
   4. LÓGICA DE MONTAGEM DOS DECKS E MODO AVANÇADO
   ========================================================================== */
document.querySelectorAll('.btn-theme').forEach(botao => {
    botao.addEventListener('click', () => {
        const temaEscolhido = botao.getAttribute('data-theme').toLowerCase();
        listBaseGames.innerHTML = '';
        listExpansions.innerHTML = '';

        const caixasDoTema = bancoDeDadosPreCarregado.filter(item => {
            if (!item.dados.theme) return false;
            const temaDoJson = item.dados.theme.toLowerCase();
            if (temaEscolhido === 'classico') return ['classic', 'modern', 'classico', 'moderno'].includes(temaDoJson);
            return temaDoJson === temaEscolhido;
        });

        let bases = caixasDoTema.filter(item => item.dados.is_base_game);
        let expansoes = caixasDoTema.filter(item => !item.dados.is_base_game);

        if (temaEscolhido === 'fantasy' && layoutFantasia) {
            const ordemBases = layoutFantasia.base_order;
            bases.sort((a, b) => {
                let indexA = ordemBases.indexOf(a.dados.game_version);
                let indexB = ordemBases.indexOf(b.dados.game_version);
                return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
            });
        }

        if (bases.length === 0) listBaseGames.innerHTML = "<p>Nenhum jogo base encontrado.</p>";
        else bases.forEach(item => criarCheckbox(item, listBaseGames));

        if (temaEscolhido === 'fantasy' && expansoes.length > 0 && layoutFantasia) {
            let expansoesRestantes = [...expansoes];
            layoutFantasia.groups.forEach(grupo => {
                let itensDoGrupo = [];
                grupo.items.forEach(nomeLista => {
                    const index = expansoesRestantes.findIndex(ex => ex.dados.game_version === nomeLista);
                    if (index !== -1) { itensDoGrupo.push(expansoesRestantes[index]); expansoesRestantes.splice(index, 1); }
                });
                if (itensDoGrupo.length > 0) montarCaixaColapsavel(grupo.title, itensDoGrupo);
            });
            if (expansoesRestantes.length > 0) montarCaixaColapsavel("📦 Outras Expansões", expansoesRestantes);
        } else {
            if (expansoes.length === 0) listExpansions.innerHTML = "<p>Nenhuma expansão encontrada.</p>";
            else expansoes.forEach(item => criarCheckbox(item, listExpansions));
        }
        
        btnConfirmLoad.disabled = true;
        mostrarTela(screenExpansion);
    });
});

function montarCaixaColapsavel(titulo, itens) {
    const details = document.createElement('details');
    details.className = 'era-group';
    const summary = document.createElement('summary');
    summary.textContent = titulo;
    details.appendChild(summary);
    const contentDiv = document.createElement('div');
    contentDiv.className = 'era-content';
    itens.forEach(item => criarCheckbox(item, contentDiv));
    details.appendChild(contentDiv);
    listExpansions.appendChild(details);
}

function criarCheckbox(item, containerAlvo) {
    const label = document.createElement('label');
    label.className = 'checkbox-item';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = item.arquivo; 
    checkbox.setAttribute('data-name', item.dados.game_version); 
    checkbox.addEventListener('change', () => {
        btnConfirmLoad.disabled = listBaseGames.querySelectorAll('input[type="checkbox"]:checked').length === 0;
    });
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(item.dados.game_version));
    containerAlvo.appendChild(label);
}

// Confirmação e Fusão de Arquivos
btnConfirmLoad.addEventListener('click', () => {
    const marcados = screenExpansion.querySelectorAll('input[type="checkbox"]:checked');
    if (marcados.length === 0) return;

    const arquivosMarcados = Array.from(marcados).map(cb => cb.value);
    const nomesMarcados = Array.from(marcados).map(cb => cb.getAttribute('data-name'));
    temWhiteDeath = arquivosMarcados.includes("white_death.json");

    baralhoZumbis = { special_spawns: { abominations: [], necromancers: [] }, spawn_data: { blue: {}, yellow: {}, orange: {}, red: {} } };

    bancoDeDadosPreCarregado.filter(item => arquivosMarcados.includes(item.arquivo)).forEach(item => {
        const jsonAtual = item.dados;
        if (jsonAtual.special_spawns?.abominations) {
            jsonAtual.special_spawns.abominations.forEach(a => { if (!baralhoZumbis.special_spawns.abominations.includes(a)) baralhoZumbis.special_spawns.abominations.push(a); });
        }
        if (jsonAtual.special_spawns?.necromancers) {
            jsonAtual.special_spawns.necromancers.forEach(n => { if (!baralhoZumbis.special_spawns.necromancers.includes(n)) baralhoZumbis.special_spawns.necromancers.push(n); });
        }

        ['blue', 'yellow', 'orange', 'red'].forEach(nivel => {
            for (const [monstro, dados] of Object.entries(jsonAtual.spawn_data?.[nivel] || {})) {
                if (!baralhoZumbis.spawn_data[nivel][monstro]) baralhoZumbis.spawn_data[nivel][monstro] = { total_cards: 0, qty_distribution: {} };
                baralhoZumbis.spawn_data[nivel][monstro].total_cards += dados.total_cards;
                for (const [quantidade, peso] of Object.entries(dados.qty_distribution)) {
                    if (!baralhoZumbis.spawn_data[nivel][monstro].qty_distribution[quantidade]) baralhoZumbis.spawn_data[nivel][monstro].qty_distribution[quantidade] = 0;
                    baralhoZumbis.spawn_data[nivel][monstro].qty_distribution[quantidade] += peso;
                }
            }
        });
    });

    currentExpansionTitle.textContent = `${nomesMarcados.join(' + ')}`;
    document.getElementById('active-decks-content').classList.remove('show');
    document.getElementById('decks-collapsible').classList.remove('open');
    resultText.textContent = dicionario[idiomaAtual].waiting;
    document.getElementById('enemy-card').style.display = 'none'; 
    
    bonusAbom = 0; bonusNecro = 0; contAbom = 0; contNecro = 0;
    
    if (document.getElementById('game-mode-toggle').checked) {
        gerarTabelaAvancada(); 
        mostrarTela(screenAdvanced);
    } else {
        atualizarVisibilidadeCaixas();
        mostrarTela(screenSpawner);
    }
});

function gerarTabelaAvancada() {
    const table = document.getElementById('advanced-table');
    const niveis = ['blue', 'yellow', 'orange', 'red'];
    let html = `<thead><tr><th class="col-header" data-i18n="tableEnemy">Inimigo</th><th class="col-header" style="color:#3498db" data-i18n="blue">Azul</th><th class="col-header" style="color:#f1c40f" data-i18n="yellow">Amarelo</th><th class="col-header" style="color:#e67e22" data-i18n="orange">Laranja</th><th class="col-header" style="color:#e74c3c" data-i18n="red">Vermelho</th></tr></thead><tbody>`;

    const listaAbomOrig = baralhoZumbis.special_spawns?.abominations || [];
    const listaNecroOrig = baralhoZumbis.special_spawns?.necromancers || [];
    const contarQtd = (arr, name) => arr.filter(x => (typeof x === 'object' ? x.file_name : x) === name).length;
    const uniqueAboms = [...new Set(listaAbomOrig.map(x => typeof x === 'object' ? x.file_name : x))];
    const uniqueNecros = [...new Set(listaNecroOrig.map(x => typeof x === 'object' ? x.file_name : x))];

    // --- BLOCO DOS NECROMANTES ---
    const lblNecro = tabelaAux['necromancer'] ? (idiomaAtual === 'pt' ? tabelaAux['necromancer'].tags_pt : tabelaAux['necromancer'].tags_en) : 'Necromantes';
    html += `<tr><td colspan="5" class="group-header"><input type="checkbox" class="group-checkbox" data-target="grp-necro" checked> ${lblNecro}</td></tr>`;
    html += `<tr><td class="row-label">${dicionario[idiomaAtual].lblBase} (%)</td>`;
    niveis.forEach(nv => { html += `<td><input class="adv-input" type="number" id="adv-necro-base-${nv}" value="${configEspeciais[nv].necroBase}" step="0.5" min="0"></td>`; });
    html += `</tr><tr><td class="row-label">${dicionario[idiomaAtual].lblInc} (%)</td>`;
    niveis.forEach(nv => { html += `<td><input class="adv-input" type="number" id="adv-necro-inc-${nv}" value="${configEspeciais[nv].necroInc}" step="0.5" min="0"></td>`; });
    html += `</tr>`;
    
    uniqueNecros.forEach(monstro => {
        const dadosInimigoObj = tabelaInimigos[monstro];
        let nomeExibicao = dadosInimigoObj ? (idiomaAtual === 'pt' ? dadosInimigoObj.name_pt : dadosInimigoObj.name_en) : monstro.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        const pesoOriginal = contarQtd(listaNecroOrig, monstro); 
        html += `<tr><td class="row-label" title="${nomeExibicao}"><input type="checkbox" class="row-checkbox grp-necro" id="check-enemy-${monstro}" checked> ${nomeExibicao}</td>`;
        niveis.forEach(nv => { html += `<td><input class="adv-input" type="number" id="adv-peso-${monstro}-${nv}" value="${pesoOriginal}" min="0"></td>`; });
        html += `</tr>`;
    });

    // --- BLOCO DAS ABOMINAÇÕES ---
    const lblAbom = tabelaAux['abomination'] ? (idiomaAtual === 'pt' ? tabelaAux['abomination'].tags_pt : tabelaAux['abomination'].tags_en) : 'Abominações';
    html += `<tr><td colspan="5" class="group-header"><input type="checkbox" class="group-checkbox" data-target="grp-abom" checked> ${lblAbom}</td></tr>`;
    html += `<tr><td class="row-label">${dicionario[idiomaAtual].lblBase} (%)</td>`;
    niveis.forEach(nv => { html += `<td><input class="adv-input" type="number" id="adv-abom-base-${nv}" value="${configEspeciais[nv].abomBase}" step="0.5" min="0"></td>`; });
    html += `</tr><tr><td class="row-label">${dicionario[idiomaAtual].lblInc} (%)</td>`;
    niveis.forEach(nv => { html += `<td><input class="adv-input" type="number" id="adv-abom-inc-${nv}" value="${configEspeciais[nv].abomInc}" step="0.5" min="0"></td>`; });
    html += `</tr>`;

    uniqueAboms.forEach(monstro => {
        const dadosInimigoObj = tabelaInimigos[monstro];
        let nomeExibicao = dadosInimigoObj ? (idiomaAtual === 'pt' ? dadosInimigoObj.name_pt : dadosInimigoObj.name_en) : monstro.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        const pesoOriginal = contarQtd(listaAbomOrig, monstro);
        html += `<tr><td class="row-label" title="${nomeExibicao}"><input type="checkbox" class="row-checkbox grp-abom" id="check-enemy-${monstro}" checked> ${nomeExibicao}</td>`;
        niveis.forEach(nv => { html += `<td><input class="adv-input" type="number" id="adv-peso-${monstro}-${nv}" value="${pesoOriginal}" min="0"></td>`; });
        html += `</tr>`;
    });

    // --- BLOCO DOS ZUMBIS NORMAIS ---
    const grupos = {};
    niveis.forEach(nv => {
        for (const [monstro, dados] of Object.entries(baralhoZumbis.spawn_data[nv] || {})) {
            let tipoChave = tabelaInimigos[monstro]?.class || monstro.split('_')[0]; 
            if(!grupos[tipoChave]) grupos[tipoChave] = {};
            if(!grupos[tipoChave][monstro]) grupos[tipoChave][monstro] = { blue: 0, yellow: 0, orange: 0, red: 0 };
            grupos[tipoChave][monstro][nv] = dados.total_cards;
        }
    });

    const ordemClasses = ["walker", "runner", "fatty"]; 
    const chavesOrdenadas = Object.keys(grupos).sort((a, b) => {
        const indexA = ordemClasses.indexOf(a), indexB = ordemClasses.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB; 
        if (indexA !== -1) return -1; 
        if (indexB !== -1) return 1;  
        return a.localeCompare(b);    
    });

    for (const tipo of chavesOrdenadas) {
        const tipoNome = tabelaAux[tipo] ? (idiomaAtual === 'pt' ? tabelaAux[tipo].tags_pt : tabelaAux[tipo].tags_en) : (tipo.charAt(0).toUpperCase() + tipo.slice(1));
        html += `<tr><td colspan="5" class="group-header"><input type="checkbox" class="group-checkbox" data-target="grp-${tipo}" checked> ${tipoNome}</td></tr>`;
        for (const [monstro, qts] of Object.entries(grupos[tipo])) {
            const dadosInimigoObj = tabelaInimigos[monstro];
            let nomeExibicao = dadosInimigoObj ? (idiomaAtual === 'pt' ? dadosInimigoObj.name_pt : dadosInimigoObj.name_en) : monstro.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
            html += `<tr><td class="row-label" title="${nomeExibicao}"><input type="checkbox" class="row-checkbox grp-${tipo}" id="check-enemy-${monstro}" checked> ${nomeExibicao}</td>`;
            niveis.forEach(nv => { html += `<td><input class="adv-input" type="number" id="adv-peso-${monstro}-${nv}" value="${qts[nv]}" min="0"></td>`; });
            html += `</tr>`;
        }
    }

    html += `</tbody>`;
    table.innerHTML = html;
    atualizarTextos(); 

    // --- EVENTO: MARCAR/DESMARCAR GRUPO INTEIRO ---
    document.querySelectorAll('.group-checkbox').forEach(chk => {
        chk.addEventListener('change', (e) => {
            const targetClass = e.target.getAttribute('data-target');
            document.querySelectorAll('.' + targetClass).forEach(box => {
                box.checked = e.target.checked;
            });
        });
    });
}


/* ==========================================================================
   5. MOTOR DE SORTEIO E ESTATÍSTICAS
   ========================================================================== */
function atualizarVisibilidadeCaixas() {
    const isAdvanced = document.getElementById('game-mode-toggle').checked;
    const isAbominafest = isAdvanced && document.getElementById('check-abominafest').checked;
    const isCabal = isAdvanced && document.getElementById('check-cabal').checked;

    const labelAbom = document.getElementById('check-abom').parentElement;
    const labelNecro = document.getElementById('check-necro').parentElement;

    const temAbom = (baralhoZumbis.special_spawns?.abominations || []).length > 0;
    const temNecro = (baralhoZumbis.special_spawns?.necromancers || []).length > 0;

    const txtInPlay = dicionario[idiomaAtual].inPlay;

    // Controle da Abominação
    if (isAbominafest || !temAbom) {
        labelAbom.style.display = 'none';
        document.getElementById('check-abom').checked = false;
    } else {
        labelAbom.style.display = 'flex';
        const spanAbom = document.getElementById('label-abom-check');
        const abomText = tabelaAux['abomination'] ? (idiomaAtual === 'pt' ? tabelaAux['abomination'].tags_pt : tabelaAux['abomination'].tags_en) : 'Abomination';
        if (spanAbom) spanAbom.textContent = `${abomText} ${txtInPlay}`;
    }

    // Controle do Necromante
    if ((isCabal && !temWhiteDeath) || !temNecro) {
        labelNecro.style.display = 'none';
        document.getElementById('check-necro').checked = false;
    } else {
        labelNecro.style.display = 'flex';
        const spanNecro = document.getElementById('label-necro-check');

        if (isCabal && temWhiteDeath) {
            if (spanNecro) spanNecro.textContent = `Defiler ${txtInPlay}`; 
        } else {
            const necroText = tabelaAux['necromancer'] ? (idiomaAtual === 'pt' ? tabelaAux['necromancer'].tags_pt : tabelaAux['necromancer'].tags_en) : 'Necromancer';
            if (spanNecro) spanNecro.textContent = `${necroText} ${txtInPlay}`;
        }
    }
}

function atualizarEstatisticas() {
    const painel = document.getElementById('stats-details');
    if (!painel) return;

    const nivel = perigoSelecionado;
    let abBase = configEspeciais[nivel].abomBase;
    let neBase = configEspeciais[nivel].necroBase;

    if (document.getElementById('game-mode-toggle').checked) {
        abBase = parseFloat(document.getElementById(`adv-abom-base-${nivel}`)?.value) || 0;
        neBase = parseFloat(document.getElementById(`adv-necro-base-${nivel}`)?.value) || 0;
    }

    const nomeNecro = tabelaAux['necromancer'] ? (idiomaAtual === 'pt' ? tabelaAux['necromancer'].tags_pt : tabelaAux['necromancer'].tags_en) : 'Necromantes';
    const nomeAbom = tabelaAux['abomination'] ? (idiomaAtual === 'pt' ? tabelaAux['abomination'].tags_pt : tabelaAux['abomination'].tags_en) : 'Abominações';
    const txtSorteados = dicionario[idiomaAtual].drawn;
    const txtChance = dicionario[idiomaAtual].currentChance;

    // NOVO: Verifica se os inimigos existem
    const temAbom = (baralhoZumbis.special_spawns?.abominations || []).length > 0;
    const temNecro = (baralhoZumbis.special_spawns?.necromancers || []).length > 0;

    let html = '';
    
    // Injeta apenas os textos correspondentes ao que realmente existe no deck
    if (temNecro) {
        html += `<p style="margin: 5px 0;"><strong>${nomeNecro}:</strong> ${txtSorteados}: <span style="color:#f1c40f">${contNecro}</span> | ${txtChance}: <span style="color:#e74c3c">${(neBase + bonusNecro).toFixed(1)}%</span></p>`;
    }
    if (temAbom) {
        html += `<p style="margin: 5px 0;"><strong>${nomeAbom}:</strong> ${txtSorteados}: <span style="color:#f1c40f">${contAbom}</span> | ${txtChance}: <span style="color:#e74c3c">${(abBase + bonusAbom).toFixed(1)}%</span></p>`;
    }
    
    // Caso o deck não tenha nenhum dos dois especiais
    if (!temNecro && !temAbom) {
        html = `<p style="margin: 5px 0; color: #777; font-style: italic;">Nenhum inimigo especial neste cenário.</p>`;
    }

    painel.innerHTML = html;
}

document.querySelectorAll('.btn-danger').forEach(botao => {
    botao.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-danger').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        perigoSelecionado = e.target.getAttribute('data-level');
        atualizarEstatisticas();
    });
});

document.getElementById('btn-confirm-advanced').addEventListener('click', () => {
    atualizarEstatisticas();
    atualizarVisibilidadeCaixas();
    mostrarTela(screenSpawner);
});

// A Lógica do Botão de Sorteio
btnDraw.addEventListener('click', () => {
    triggerFlash();
    const nivel = perigoSelecionado;
    const isAdvanced = document.getElementById('game-mode-toggle').checked;
    const isAbominafest = isAdvanced && document.getElementById('check-abominafest').checked;
    const isCabal = isAdvanced && document.getElementById('check-cabal').checked;

    const isAbomInPlay = document.getElementById('check-abom').checked;
    const isNecroInPlay = document.getElementById('check-necro').checked;
    const bloqueiaAbom = !isAbominafest && isAbomInPlay;
    const bloqueiaNecro = !isCabal && isNecroInPlay; 

    let baseAbom = configEspeciais[nivel].abomBase, incAbom = configEspeciais[nivel].abomInc;
    let baseNecro = configEspeciais[nivel].necroBase, incNecro = configEspeciais[nivel].necroInc;

    // --- NOVA LÓGICA DE PISCINAS COM PESOS (POOLS) ---
    const listaAbomOriginal = baralhoZumbis.special_spawns?.abominations || [];
    const listaNecroOriginal = baralhoZumbis.special_spawns?.necromancers || [];
    let poolAbom = [];
    let poolNecro = [];
    let totalPesoAbom = 0;
    let totalPesoNecro = 0;

    if (isAdvanced) {
        baseAbom = parseFloat(document.getElementById(`adv-abom-base-${nivel}`)?.value) || 0;
        incAbom = parseFloat(document.getElementById(`adv-abom-inc-${nivel}`)?.value) || 0;
        baseNecro = parseFloat(document.getElementById(`adv-necro-base-${nivel}`)?.value) || 0;
        incNecro = parseFloat(document.getElementById(`adv-necro-inc-${nivel}`)?.value) || 0;

        // Puxa o peso de cada Abominação da tabela e verifica se o Checkbox está marcado
        const uniqueAboms = [...new Set(listaAbomOriginal.map(a => typeof a === 'object' ? a.file_name : a))];
        uniqueAboms.forEach(monstro => {
            if (document.getElementById(`check-enemy-${monstro}`)?.checked !== false) {
                const peso = parseFloat(document.getElementById(`adv-peso-${monstro}-${nivel}`)?.value) || 0;
                if (peso > 0) { poolAbom.push({ nome: monstro, peso: peso }); totalPesoAbom += peso; }
            }
        });

        // Puxa o peso de cada Necromante
        const uniqueNecros = [...new Set(listaNecroOriginal.map(n => typeof n === 'object' ? n.file_name : n))];
        uniqueNecros.forEach(monstro => {
            if (document.getElementById(`check-enemy-${monstro}`)?.checked !== false) {
                const peso = parseFloat(document.getElementById(`adv-peso-${monstro}-${nivel}`)?.value) || 0;
                if (peso > 0) { poolNecro.push({ nome: monstro, peso: peso }); totalPesoNecro += peso; }
            }
        });
    } else {
        // Se for o Padrão, usa 1 de peso por carta inserida no deck
        listaAbomOriginal.forEach(a => {
            poolAbom.push({ nome: (typeof a === 'object' ? a.file_name : a), peso: 1 }); totalPesoAbom += 1;
        });
        listaNecroOriginal.forEach(n => {
            poolNecro.push({ nome: (typeof n === 'object' ? n.file_name : n), peso: 1 }); totalPesoNecro += 1;
        });
    }

    const temAbom = poolAbom.length > 0;
    const temNecro = poolNecro.length > 0;

    const chanceFinalAbom = (temAbom && !bloqueiaAbom) ? (baseAbom + bonusAbom) : 0;
    const chanceFinalNecro = (temNecro && !bloqueiaNecro) ? (baseNecro + bonusNecro) : 0;
    
    const roleta = Math.random() * 100;
    let file_name_sorteado = "";
    let quantidadeFinal = 1;

    // --- SORTEIOS ESPECIAIS (AGORA COM MATEMÁTICA DE PESOS) ---
    if (temAbom && !bloqueiaAbom && roleta <= chanceFinalAbom) {
        let rand = Math.random() * totalPesoAbom;
        let sorteado = poolAbom[poolAbom.length - 1].nome;
        for (let c of poolAbom) {
            rand -= c.peso;
            if (rand <= 0) { sorteado = c.nome; break; }
        }
        file_name_sorteado = sorteado;
        bonusAbom = 0; contAbom++; 
        if (!isAbominafest) document.getElementById('check-abom').checked = true; 
    }
    else if (temNecro && !bloqueiaNecro && roleta <= (chanceFinalAbom + chanceFinalNecro)) {
        let poolSorteio = poolNecro;
        let pesoTotalSorteio = totalPesoNecro;

        if (isCabal && temWhiteDeath && !isNecroInPlay) {
            const defiler = poolNecro.find(n => n.nome === 'defiler_necromancer');
            if (defiler) { poolSorteio = [defiler]; pesoTotalSorteio = defiler.peso; }
        }

        let rand = Math.random() * pesoTotalSorteio;
        let sorteado = poolSorteio[poolSorteio.length - 1].nome;
        for (let c of poolSorteio) {
            rand -= c.peso;
            if (rand <= 0) { sorteado = c.nome; break; }
        }
        file_name_sorteado = sorteado;
        bonusNecro = 0; contNecro++; 
        
        if (!isCabal || (isCabal && temWhiteDeath && file_name_sorteado === 'defiler_necromancer')) {
            document.getElementById('check-necro').checked = true;
        }
    }
    // --- SORTEIO DOS ZUMBIS NORMAIS ---
    else {
        if (temAbom && !bloqueiaAbom) bonusAbom += incAbom;
        if (temNecro && !bloqueiaNecro) bonusNecro += incNecro;

        const grupos = {};
        for (const [nomeCarta, dadosDaCarta] of Object.entries(baralhoZumbis.spawn_data[nivel] || {})) {
            let pesoAtual = dadosDaCarta.total_cards;
            if (isAdvanced) {
                // EXCLUI SE A CAIXA ESTIVER DESMARCADA
                if (document.getElementById(`check-enemy-${nomeCarta}`)?.checked === false) {
                    pesoAtual = 0;
                } else {
                    const inputPeso = document.getElementById(`adv-peso-${nomeCarta}-${nivel}`);
                    if (inputPeso) pesoAtual = parseFloat(inputPeso.value); 
                }
            }
            if (pesoAtual > 0) {
                const tipo = tabelaInimigos[nomeCarta]?.class || nomeCarta.split('_')[0]; 
                if (!grupos[tipo]) grupos[tipo] = { totalPeso: 0, variantes: {} };
                grupos[tipo].variantes[nomeCarta] = { ...dadosDaCarta, total_cards: pesoAtual };
                grupos[tipo].totalPeso += pesoAtual;
            }
        }
        
        let pesoTotalTipos = Object.values(grupos).reduce((soma, grupo) => soma + grupo.totalPeso, 0);
        if (pesoTotalTipos <= 0) {
            resultText.textContent = "Sem zumbis válidos!";
            atualizarEstatisticas();
            return;
        }

        let randTipo = Math.random() * pesoTotalTipos;
        let tipoSorteado = Object.keys(grupos)[0]; 
        for (const [tipo, dadosGrupo] of Object.entries(grupos)) {
            randTipo -= dadosGrupo.totalPeso;
            if (randTipo <= 0) { tipoSorteado = tipo; break; }
        }

        const grupoEscolhido = grupos[tipoSorteado];
        let randVariante = Math.random() * grupoEscolhido.totalPeso;
        let varianteSorteada = Object.keys(grupoEscolhido.variantes)[0]; 
        let dadosVariante = grupoEscolhido.variantes[varianteSorteada];
        
        for (const [variante, dados] of Object.entries(grupoEscolhido.variantes)) {
            randVariante -= dados.total_cards;
            if (randVariante <= 0) { varianteSorteada = variante; dadosVariante = dados; break; }
        }

        const dist = dadosVariante.qty_distribution;
        let pesoTotalQty = Object.values(dist).reduce((soma, peso) => soma + peso, 0);
        let randQty = Math.random() * pesoTotalQty;
        quantidadeFinal = Object.keys(dist)[0]; 
        
        for (const [quantidade, peso] of Object.entries(dist)) {
            randQty -= peso;
            if (randQty <= 0) { quantidadeFinal = quantidade; break; }
        }
        file_name_sorteado = varianteSorteada;
    }

    // --- RENDERIZANDO O RESULTADO E O CARD ---
    // Prevenção de erro caso não ache o arquivo de forma alguma
    if (!file_name_sorteado) file_name_sorteado = "inimigo_desconhecido"; 
    
    const dadosInimigo = tabelaInimigos[file_name_sorteado];
    const enemyCard = document.getElementById('enemy-card');
    const statsDiv = document.querySelector('.enemy-stats');

    if (dadosInimigo) {
        enemyCard.style.display = 'block';
        const nomeInimigo = idiomaAtual === 'pt' ? dadosInimigo.name_pt : dadosInimigo.name_en;
        resultText.textContent = (quantidadeFinal === "0" || quantidadeFinal === 0) ? `${nomeInimigo}` : `${quantidadeFinal}x ${nomeInimigo}`;

        const imgElement = document.getElementById('enemy-image');
        if (dadosInimigo.image) {
            imgElement.src = dadosInimigo.image;
            imgElement.style.display = 'block';
        } else imgElement.style.display = 'none';

        let badgeElement = document.getElementById('enemy-class');
        if (dadosInimigo.class) {
            badgeElement.style.display = 'inline-block';
            badgeElement.textContent = tabelaAux[dadosInimigo.class] ? (idiomaAtual === 'pt' ? tabelaAux[dadosInimigo.class].tags_pt : tabelaAux[dadosInimigo.class].tags_en) : dadosInimigo.class.charAt(0).toUpperCase() + dadosInimigo.class.slice(1);
        } else badgeElement.style.display = 'none';

        if (dadosInimigo.actions && String(dadosInimigo.actions).trim() !== '') {
            statsDiv.style.display = 'grid'; 
            ['actions', 'range', 'damage', 'move', 'lethal', 'ap'].forEach(stat => {
                document.getElementById(`label-${stat}`).textContent = tabelaAux[stat] ? (idiomaAtual === 'pt' ? tabelaAux[stat].tags_pt : tabelaAux[stat].tags_en) : stat.charAt(0).toUpperCase() + stat.slice(1);
                document.getElementById(`stat-${stat}`).textContent = dadosInimigo[stat] || (stat === 'actions' || stat === 'damage' || stat === 'move' || stat === 'lethal' || stat === 'ap' ? '1' : '0');
            });
        } else statsDiv.style.display = 'none';

        const textElement = document.getElementById('enemy-rules');
        textElement.textContent = (idiomaAtual === 'pt' ? dadosInimigo.rules_pt : dadosInimigo.rules_en) || dicionario[idiomaAtual].noEnemyData;

    } else {
        enemyCard.style.display = 'none';
        const nomeFormatado = file_name_sorteado.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        resultText.textContent = (quantidadeFinal === "0" || quantidadeFinal === 0) ? `${nomeFormatado}` : `${quantidadeFinal}x ${nomeFormatado}`;
    }
    atualizarEstatisticas();
});

// Comportamento da Caixa Retrátil das Estatísticas e dos Decks
const btnToggleDecks = document.getElementById('btn-toggle-decks');
if(btnToggleDecks) btnToggleDecks.addEventListener('click', () => { document.getElementById('active-decks-content').classList.toggle('show'); document.getElementById('decks-collapsible').classList.toggle('open'); });

const btnToggleStats = document.getElementById('btn-toggle-stats');
if(btnToggleStats) btnToggleStats.addEventListener('click', () => { document.getElementById('stats-content').classList.toggle('show'); document.getElementById('stats-collapsible').classList.toggle('open'); });