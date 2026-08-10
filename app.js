// --- SISTEMA DE IDIOMA E DICIONÁRIO INTERNO ---
let idiomaAtual = 'pt';
const dicionario = {
    pt: {
        linkDB: "Zombicide DB",
        btnHome: "Início",
        activeDecks: "Decks Ativos",
        appTitle: "Zombicide Spawn", chooseEra: "Escolha o Cenário:", eraClassic: "Clássico / Moderno", eraFantasy: "Fantasia", eraWest: "Velho Oeste",
        configMatch: "Configure a Partida", baseGames: "Base", expansions: "Expansões",
        btnConfirm: "Confirmar", btnBack: "← Voltar", dangerLevel: "Nível de Perigo:",
        blue: "Azul", yellow: "Amarelo", orange: "Laranja", red: "Vermelho", btnDraw: "Entrada!",
        resultLabel: "Resultado:", btnBackDecks: "← Escolher Outros Decks", waiting: "Aguardando...",
        noEnemyData: "Nenhuma regra especial listada."
    },
    en: {
        linkDB: "Zombicide DB",
        btnHome: "Home",
        activeDecks: "Active Decks",
        appTitle: "Zombicide Spawn", chooseEra: "Choose Setting:", eraClassic: "Classic / Modern", eraFantasy: "Fantasy", eraWest: "Western",
        configMatch: "Match Setup", baseGames: "Base", expansions: "Expansions",
        btnConfirm: "Confirm", btnBack: "← Back", dangerLevel: "Danger Level:",
        blue: "Blue", yellow: "Yellow", orange: "Orange", red: "Red", btnDraw: "Spawn!",
        resultLabel: "Result:", btnBackDecks: "← Choose Other Decks", waiting: "Waiting...",
        noEnemyData: "No special rules listed."
    }
};

// Captura das Telas
const screenTheme = document.getElementById('screen-theme');
const screenExpansion = document.getElementById('screen-expansion');
const screenSpawner = document.getElementById('screen-spawner');

// Elementos Dinâmicos
const listBaseGames = document.getElementById('list-base-games');
const listExpansions = document.getElementById('list-expansions');
const currentExpansionTitle = document.getElementById('current-expansion-title');
const btnConfirmLoad = document.getElementById('btn-confirm-load');

// Elementos do Sorteador
const btnDraw = document.getElementById('btn-draw');
const resultText = document.getElementById('result-text');
const appContainer = document.getElementById('app-container');

let bancoDeDadosPreCarregado = []; 
let baralhoZumbis = {}; 
let tabelaInimigos = {};
let tabelaAux = {}; // NOVO: Guarda o dicionário do aux.json 
let perigoSelecionado = 'blue';
let layoutFantasia = null; // NOVO: Guarda a configuração visual das Eras

// --- ATUALIZADOR DE TEXTOS (LOCALIZATION) ---
function atualizarTextos() {
    document.querySelectorAll('[data-i18n]').forEach(elemento => {
        const chave = elemento.getAttribute('data-i18n');
        if (dicionario[idiomaAtual][chave]) {
            elemento.textContent = dicionario[idiomaAtual][chave];
        }
    });
}

// Ouve quando o usuário escolhe um novo idioma na lista
document.getElementById('lang-select').addEventListener('change', (e) => {
    idiomaAtual = e.target.value; // 'pt' ou 'en'
    atualizarTextos();
});
atualizarTextos();

// --- INICIALIZAÇÃO AUTOMÁTICA OTIMIZADA ---
async function inicializarApp() {
    try {
        resultText.textContent = "Carregando banco de dados...";
        
        // 1. Carrega primeiro o arquivo de configuração e índice
        let listaArquivosJson = [];
        try {
            const resLista = await fetch('sources/deck_list.json');
            if (resLista.ok) {
                const dadosConfig = await resLista.json();
                listaArquivosJson = dadosConfig.files; // Puxa apenas a lista de arquivos
                layoutFantasia = dadosConfig.layout_fantasy; // Puxa a configuração do menu
            } else {
                throw new Error("Arquivo deck_list.json não encontrado.");
            }
        } catch (e) {
            console.error("🚨 Falha ao ler o índice de expansões:", e);
            resultText.textContent = "Erro ao carregar a lista de decks.";
            return; 
        }
        
        // 2. Faz o download de forma independente para cada arquivo da lista
        const requisicoes = listaArquivosJson.map(async (arq) => {
            try {
                const resposta = await fetch(`sources/${arq}`);
                if (!resposta.ok) return null; 
                const dadosJson = await resposta.json();
                return { arquivo: arq, dados: dadosJson };
            } catch (erroArquivo) {
                return null;
            }
        });
        
        // Espera todos terminarem
        const resultadosBrutos = await Promise.all(requisicoes);
        bancoDeDadosPreCarregado = resultadosBrutos.filter(item => item !== null);
        
        // 3. Carrega a Tabela de Inimigos (Inteligente)
        try {
            const resInimigos = await fetch('sources/enemies.json');
            if (resInimigos.ok) {
                const dados = await resInimigos.json();
                // Se for um Array, converte usando a coluna "id" como chave
                if (Array.isArray(dados)) {
                    tabelaInimigos = dados.reduce((acc, item) => {
                        acc[item.id] = item;
                        return acc;
                    }, {});
                } else {
                    tabelaInimigos = dados;
                }
                console.log("✅ Tabela de Inimigos carregada e indexada com sucesso.");
            }
        } catch (e) {
            console.error("Aviso: enemies.json não encontrado ou inválido.");
        }

        // 4. Carrega a Tabela Auxiliar/Traduções (Inteligente)
        try {
            const resAux = await fetch('sources/aux.json');
            if (resAux.ok) {
                const dados = await resAux.json();
                // Se for um Array, converte usando a coluna "tags" como chave
                if (Array.isArray(dados)) {
                    tabelaAux = dados.reduce((acc, item) => {
                        acc[item.tags] = item;
                        return acc;
                    }, {});
                } else {
                    tabelaAux = dados;
                }
                console.log("✅ Tabela Auxiliar carregada e indexada com sucesso.");
            }
        } catch (e) {
            console.error("Aviso: aux.json não encontrado ou inválido.");
        }

        resultText.textContent = dicionario[idiomaAtual].waiting;
        console.log(`SUCESSO! ${bancoDeDadosPreCarregado.length} baralhos carregados.`);
        
    } catch (erroFatal) {
        console.error("Erro fatal na inicialização:", erroFatal);
    }
}
inicializarApp();

// --- CONTROLE DE NÍVEL DE PERIGO ---
document.querySelectorAll('.btn-danger').forEach(botao => {
    botao.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-danger').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        perigoSelecionado = e.target.getAttribute('data-level');
    });
});

// --- NAVEGAÇÃO E FILTRAGEM DINÂMICA ---
function mostrarTela(telaAtiva) {
    screenTheme.classList.remove('active');
    screenExpansion.classList.remove('active');
    screenSpawner.classList.remove('active');
    telaAtiva.classList.add('active');
}

document.querySelectorAll('.btn-theme').forEach(botao => {
    botao.addEventListener('click', () => {
        const temaEscolhido = botao.getAttribute('data-theme').toLowerCase();
        
        listBaseGames.innerHTML = '';
        listExpansions.innerHTML = '';

        const caixasDoTema = bancoDeDadosPreCarregado.filter(item => {
            if (!item.dados.theme) return false;
            const temaDoJson = item.dados.theme.toLowerCase();
            if (temaEscolhido === 'classico') {
                return temaDoJson === 'classic' || temaDoJson === 'modern' || temaDoJson === 'classico' || temaDoJson === 'moderno';
            }
            return temaDoJson === temaEscolhido;
        });

        let bases = caixasDoTema.filter(item => item.dados.is_base_game);
        let expansoes = caixasDoTema.filter(item => !item.dados.is_base_game);

        // --- ORDENAÇÃO DOS JOGOS BASE (VIA JSON) ---
        if (temaEscolhido === 'fantasy' && layoutFantasia) {
            const ordemBases = layoutFantasia.base_order;
            bases.sort((a, b) => {
                let indexA = ordemBases.indexOf(a.dados.game_version);
                let indexB = ordemBases.indexOf(b.dados.game_version);
                if (indexA === -1) indexA = 999;
                if (indexB === -1) indexB = 999;
                return indexA - indexB;
            });
        }

        if (bases.length === 0) listBaseGames.innerHTML = "<p>Nenhum jogo base encontrado.</p>";
        else bases.forEach(item => criarCheckbox(item, listBaseGames));

        // --- AGRUPAMENTO DAS EXPANSÕES EM MENUS DROPDOWN (VIA JSON) ---
        if (temaEscolhido === 'fantasy' && expansoes.length > 0 && layoutFantasia) {
            
            let expansoesRestantes = [...expansoes];

            // Lê as Eras descritas no deck_list.json
            layoutFantasia.groups.forEach(grupo => {
                let itensDoGrupo = [];
                
                grupo.items.forEach(nomeLista => {
                    const index = expansoesRestantes.findIndex(ex => ex.dados.game_version === nomeLista);
                    if (index !== -1) {
                        itensDoGrupo.push(expansoesRestantes[index]);
                        expansoesRestantes.splice(index, 1); 
                    }
                });

                if (itensDoGrupo.length > 0) {
                    const details = document.createElement('details');
                    details.className = 'era-group';
                    
                    const summary = document.createElement('summary');
                    summary.textContent = grupo.title;
                    details.appendChild(summary);
                    
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'era-content';
                    itensDoGrupo.forEach(item => criarCheckbox(item, contentDiv));
                    details.appendChild(contentDiv);
                    
                    listExpansions.appendChild(details);
                }
            });

            // Se você comprar uma expansão nova e não atualizar o arquivo, ela cai aqui.
            if (expansoesRestantes.length > 0) {
                const details = document.createElement('details');
                details.className = 'era-group';
                
                const summary = document.createElement('summary');
                summary.textContent = "📦 Outras Expansões";
                details.appendChild(summary);
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'era-content';
                expansoesRestantes.forEach(item => criarCheckbox(item, contentDiv));
                details.appendChild(contentDiv);
                
                listExpansions.appendChild(details);
            }

        } else {
            // Se for Sci-fi, Velho Oeste, etc, continua carregando a lista solta tradicional
            if (expansoes.length === 0) listExpansions.innerHTML = "<p>Nenhuma expansão encontrada.</p>";
            else expansoes.forEach(item => criarCheckbox(item, listExpansions));
        }
        
        btnConfirmLoad.disabled = true;
        mostrarTela(screenExpansion);
    });
});

function validarBotaoConfirmar() {
    const basesMarcadas = listBaseGames.querySelectorAll('input[type="checkbox"]:checked');
    btnConfirmLoad.disabled = basesMarcadas.length === 0;
}

function criarCheckbox(item, containerAlvo) {
    const label = document.createElement('label');
    label.className = 'checkbox-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = item.arquivo; 
    checkbox.setAttribute('data-name', item.dados.game_version); 
    
    checkbox.addEventListener('change', validarBotaoConfirmar);
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(item.dados.game_version));
    containerAlvo.appendChild(label);
}

// --- FUSÃO MATEMÁTICA DOS DECK SELECIONADOS ---
btnConfirmLoad.addEventListener('click', () => {
    const marcados = screenExpansion.querySelectorAll('input[type="checkbox"]:checked');
    if (marcados.length === 0) return;

    const arquivosMarcados = Array.from(marcados).map(cb => cb.value);
    const nomesMarcados = Array.from(marcados).map(cb => cb.getAttribute('data-name'));

    baralhoZumbis = {
        special_spawns: { abominations: [], necromancers: [] },
        spawn_data: { blue: {}, yellow: {}, orange: {}, red: {} }
    };

    const jsonsParaMesclar = bancoDeDadosPreCarregado.filter(item => arquivosMarcados.includes(item.arquivo));

    jsonsParaMesclar.forEach(item => {
        const jsonAtual = item.dados;

        if (jsonAtual.special_spawns?.abominations) {
            jsonAtual.special_spawns.abominations.forEach(a => {
                if (!baralhoZumbis.special_spawns.abominations.includes(a)) baralhoZumbis.special_spawns.abominations.push(a);
            });
        }
        if (jsonAtual.special_spawns?.necromancers) {
            jsonAtual.special_spawns.necromancers.forEach(n => {
                if (!baralhoZumbis.special_spawns.necromancers.includes(n)) baralhoZumbis.special_spawns.necromancers.push(n);
            });
        }

        const niveis = ['blue', 'yellow', 'orange', 'red'];
        niveis.forEach(nivel => {
            const dadosNivelOrigem = jsonAtual.spawn_data?.[nivel] || {};
            for (const [monstro, dados] of Object.entries(dadosNivelOrigem)) {
                if (!baralhoZumbis.spawn_data[nivel][monstro]) {
                    baralhoZumbis.spawn_data[nivel][monstro] = { total_cards: 0, qty_distribution: {} };
                }
                baralhoZumbis.spawn_data[nivel][monstro].total_cards += dados.total_cards;

                for (const [quantidade, peso] of Object.entries(dados.qty_distribution)) {
                    if (!baralhoZumbis.spawn_data[nivel][monstro].qty_distribution[quantidade]) {
                        baralhoZumbis.spawn_data[nivel][monstro].qty_distribution[quantidade] = 0;
                    }
                    baralhoZumbis.spawn_data[nivel][monstro].qty_distribution[quantidade] += peso;
                }
            }
        });
    });

    currentExpansionTitle.textContent = `${nomesMarcados.join(' + ')}`;
    activeDecksContent.classList.remove('show');
    collapsibleContainer.classList.remove('open');
    resultText.textContent = dicionario[idiomaAtual].waiting;
    document.getElementById('enemy-card').style.display = 'none'; // Reseta o card ao voltar
    bonusAbom = 0;
    bonusNecro = 0;
    mostrarTela(screenSpawner);
});

// Retorna para a tela de Temas
document.getElementById('btn-back-to-theme').addEventListener('click', () => mostrarTela(screenTheme));

// Botão Home: Recarrega a página inteira para limpar a memória e resetar o jogo
document.getElementById('btn-home').addEventListener('click', () => {
    window.location.reload();
});

// --- MOTOR DE SORTEIO E TIMERS ---
const configEspeciais = {
    blue:   { abomBase: 0, abomInc: 0.5,   necroBase: 1, necroInc: 0.5 },
    yellow: { abomBase: 1, abomInc: 0.5,   necroBase: 2, necroInc: 1 },
    orange: { abomBase: 2, abomInc: 1,     necroBase: 3, necroInc: 1.5 },
    red:    { abomBase: 3, abomInc: 1,     necroBase: 4, necroInc: 1.5 }
};

let bonusAbom = 0;
let bonusNecro = 0;

btnDraw.addEventListener('click', () => {
    triggerFlash();
    const nivel = perigoSelecionado;
    const cartasDoNivel = baralhoZumbis.spawn_data[nivel];
    
    if (!cartasDoNivel) {
        resultText.textContent = `Sem dados / No data`;
        return; 
    }

    const listaAbom = baralhoZumbis.special_spawns?.abominations || [];
    const listaNecro = baralhoZumbis.special_spawns?.necromancers || [];
    const temAbom = listaAbom.length > 0;
    const temNecro = listaNecro.length > 0;

    const chanceFinalAbom = temAbom ? (configEspeciais[nivel].abomBase + bonusAbom) : 0;
    const chanceFinalNecro = temNecro ? (configEspeciais[nivel].necroBase + bonusNecro) : 0;
    const roleta = Math.random() * 100;

    let file_name_sorteado = "";
    let quantidadeFinal = 1;

    // Sorteio Especial vs Sorteio Normal
    if (roleta <= chanceFinalAbom) {
        const sorteado = listaAbom[Math.floor(Math.random() * listaAbom.length)];
        file_name_sorteado = typeof sorteado === 'object' ? sorteado.file_name : sorteado;
        bonusAbom = 0; 
    }
    else if (roleta <= (chanceFinalAbom + chanceFinalNecro)) {
        const sorteado = listaNecro[Math.floor(Math.random() * listaNecro.length)];
        file_name_sorteado = typeof sorteado === 'object' ? sorteado.file_name : sorteado;
        bonusNecro = 0; 
    }
    else {
        if (temAbom) bonusAbom += configEspeciais[nivel].abomInc;
        if (temNecro) bonusNecro += configEspeciais[nivel].necroInc;

        const grupos = {};
        for (const [nomeCarta, dadosDaCarta] of Object.entries(cartasDoNivel)) {
            const tipo = nomeCarta.split('_')[0]; 
            if (!grupos[tipo]) {
                grupos[tipo] = { totalPeso: 0, variantes: {} };
            }
            grupos[tipo].variantes[nomeCarta] = dadosDaCarta;
            grupos[tipo].totalPeso += dadosDaCarta.total_cards;
        }

        let pesoTotalTipos = Object.values(grupos).reduce((soma, grupo) => soma + grupo.totalPeso, 0);
        let randTipo = Math.random() * pesoTotalTipos;
        let tipoSorteado;
        
        for (const [tipo, dadosGrupo] of Object.entries(grupos)) {
            randTipo -= dadosGrupo.totalPeso;
            if (randTipo <= 0) { tipoSorteado = tipo; break; }
        }

        const grupoEscolhido = grupos[tipoSorteado];
        let randVariante = Math.random() * grupoEscolhido.totalPeso;
        let varianteSorteada, dadosVariante;
        
        for (const [variante, dados] of Object.entries(grupoEscolhido.variantes)) {
            randVariante -= dados.total_cards;
            if (randVariante <= 0) { varianteSorteada = variante; dadosVariante = dados; break; }
        }

        const dist = dadosVariante.qty_distribution;
        let pesoTotalQty = Object.values(dist).reduce((soma, peso) => soma + peso, 0);
        let randQty = Math.random() * pesoTotalQty;
        
        for (const [quantidade, peso] of Object.entries(dist)) {
            randQty -= peso;
            if (randQty <= 0) { quantidadeFinal = quantidade; break; }
        }
        file_name_sorteado = varianteSorteada;
    }

    // --- RENDERIZANDO O RESULTADO E O CARD ---
    const dadosInimigo = tabelaInimigos[file_name_sorteado];
    const enemyCard = document.getElementById('enemy-card');
    const statsDiv = document.querySelector('.enemy-stats');

    if (dadosInimigo) {
        enemyCard.style.display = 'block';
        
        // Define o NOME usando o idioma atual
        const nomeInimigo = idiomaAtual === 'pt' ? dadosInimigo.name_pt : dadosInimigo.name_en;
        
        if (quantidadeFinal === "0" || quantidadeFinal === 0) {
            resultText.textContent = `${nomeInimigo}`;
        } else {
            resultText.textContent = `${quantidadeFinal}x ${nomeInimigo}`;
        }

        // Define a Imagem
        const imgElement = document.getElementById('enemy-image');
        if (dadosInimigo.image) {
            imgElement.src = dadosInimigo.image;
            imgElement.style.display = 'block';
        } else {
            imgElement.style.display = 'none';
        }

        // --- TRADUÇÃO DA CLASSE (aux.json) ---
        let classeKey = dadosInimigo.class;
        let badgeElement = document.getElementById('enemy-class');
        if (classeKey) {
            badgeElement.style.display = 'inline-block';
            // Se encontrar a classe no aux.json, traduz. Se não, exibe o nome original capitalizado.
            if (tabelaAux[classeKey]) {
                badgeElement.textContent = idiomaAtual === 'pt' ? tabelaAux[classeKey].tags_pt : tabelaAux[classeKey].tags_en;
            } else {
                badgeElement.textContent = classeKey.charAt(0).toUpperCase() + classeKey.slice(1);
            }
        } else {
            badgeElement.style.display = 'none'; // Esconde se for um evento que não tem classe
        }

        // Verifica se é um evento ou zumbi de verdade baseado na coluna de Ações
        if (dadosInimigo.actions && String(dadosInimigo.actions).trim() !== '') {
            statsDiv.style.display = 'grid'; 
            
            // 1. Traduz e aplica os rótulos de status usando o aux.json
            document.getElementById('label-actions').textContent = tabelaAux['actions'] ? (idiomaAtual === 'pt' ? tabelaAux['actions'].tags_pt : tabelaAux['actions'].tags_en) : 'Ações';
            document.getElementById('label-range').textContent = tabelaAux['range'] ? (idiomaAtual === 'pt' ? tabelaAux['range'].tags_pt : tabelaAux['range'].tags_en) : 'Alcance';
            document.getElementById('label-damage').textContent = tabelaAux['damage'] ? (idiomaAtual === 'pt' ? tabelaAux['damage'].tags_pt : tabelaAux['damage'].tags_en) : 'Dano';
            document.getElementById('label-move').textContent = tabelaAux['move'] ? (idiomaAtual === 'pt' ? tabelaAux['move'].tags_pt : tabelaAux['move'].tags_en) : 'Movimento';
            document.getElementById('label-lethal').textContent = tabelaAux['lethal'] ? (idiomaAtual === 'pt' ? tabelaAux['lethal'].tags_pt : tabelaAux['lethal'].tags_en) : 'Letal';
            document.getElementById('label-ap').textContent = tabelaAux['ap'] ? (idiomaAtual === 'pt' ? tabelaAux['ap'].tags_pt : tabelaAux['ap'].tags_en) : 'PA';

            // 2. Aplica os valores numéricos dos status
            document.getElementById('stat-actions').textContent = dadosInimigo.actions;
            document.getElementById('stat-range').textContent = dadosInimigo.range || '0';
            document.getElementById('stat-damage').textContent = dadosInimigo.damage || '1';
            document.getElementById('stat-move').textContent = dadosInimigo.move || '1';
            document.getElementById('stat-lethal').textContent = dadosInimigo.lethal || '1';
            document.getElementById('stat-ap').textContent = dadosInimigo.ap || '1';
        } else {
            statsDiv.style.display = 'none';
        }

        // Regras Especiais
        const textElement = document.getElementById('enemy-rules');
        const regra = idiomaAtual === 'pt' ? dadosInimigo.rules_pt : dadosInimigo.rules_en;
        textElement.textContent = regra || dicionario[idiomaAtual].noEnemyData;

    } else {
        // Fallback: Se o JSON de inimigos não tiver esse monstro
        enemyCard.style.display = 'none';
        const nomeFormatado = file_name_sorteado.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        if (quantidadeFinal === "0" || quantidadeFinal === 0) {
            resultText.textContent = `${nomeFormatado}`;
        } else {
            resultText.textContent = `${quantidadeFinal}x ${nomeFormatado}`;
        }
    }
});

// --- FUNCIONALIDADE DA CAIXA RETRÁTIL (ACCORDION) ---
const btnToggleDecks = document.getElementById('btn-toggle-decks');
const activeDecksContent = document.getElementById('active-decks-content');
const collapsibleContainer = document.getElementById('decks-collapsible');

btnToggleDecks.addEventListener('click', () => {
    activeDecksContent.classList.toggle('show');
    collapsibleContainer.classList.toggle('open');
});

function triggerFlash() {
    appContainer.classList.add('flash-effect');
    setTimeout(() => { appContainer.classList.remove('flash-effect'); }, 150);
}