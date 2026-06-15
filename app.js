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
const dangerLevel = document.getElementById('danger-level');

// --- SUA LISTA DE ARQUIVOS PARA TESTE ---
// Quando criar um JSON novo, basta jogar o nome dele aqui dentro!
const listaArquivosJson = [
    'classic_season1.json',
    'classic_season2_prison_outbreak.json',
    'black_plague.json',
    'green_horde.json',
    'white_death.json',
    'wulfsburg.json',
    'friends_and_foes.json',
    'no_rest_for_the_wicked.json',
    'frozen_fortress.json',
    'tmnt_timecrash.json',
    'zombie_bosses.json',
    'deadeye_walkers.json',
    'murder_of_crowz.json',
    'iron_maiden_1f.json',
    'iron_maiden_2f.json',
    'iron_maiden_3f.json',
    'berserk_walkers.json',
    'warlords_of_the_middle_kingdom.json',
    'warlords_of_the_rising_sun.json'
    

];

// Memória do App: Guardará todos os JSONs lidos com seus respectivos metadados
let bancoDeDadosPreCarregado = []; 

// Baralho unificado que será gerado após o usuário marcar os checkboxes
let baralhoZumbis = {}; 

// --- 1. INICIALIZAÇÃO AUTOMÁTICA OTIMIZADA E BLINDADA ---
async function inicializarApp() {
    try {
        resultText.textContent = "Carregando banco de dados...";
        
        // Faz o download de forma independente para cada arquivo
        const requisicoes = listaArquivosJson.map(async (arq) => {
            try {
                const resposta = await fetch(`sources/${arq}`);
                
                // Se o Live Server não achar o arquivo (Erro 404), ele isola o erro aqui
                if (!resposta.ok) {
                    console.error(`🚨 ALERTA: Arquivo não encontrado ou inacessível -> sources/${arq}`);
                    return null; 
                }
                
                const dadosJson = await resposta.json();
                return { arquivo: arq, dados: dadosJson };
                
            } catch (erroArquivo) {
                // Se o arquivo existir mas o JSON estiver quebrado/vazio por dentro
                console.error(`🚨 ALERTA: O arquivo ${arq} existe, mas o JSON dentro dele tem um erro de sintaxe.`, erroArquivo);
                return null;
            }
        });
        
        // Espera todos terminarem (os que deram certo e os que falharam)
        const resultadosBrutos = await Promise.all(requisicoes);
        
        // Filtra e guarda apenas os que deram 100% certo (remove os nulos)
        bancoDeDadosPreCarregado = resultadosBrutos.filter(item => item !== null);
        
        resultText.textContent = "Aguardando...";
        console.log(`✅ SUCESSO! ${bancoDeDadosPreCarregado.length} baralhos foram carregados perfeitamente na memória.`);
        
    } catch (erroFatal) {
        console.error("Erro fatal na inicialização:", erroFatal);
        alert("Ocorreu um erro crítico ao iniciar. Verifique o console.");
    }
}
// Liga o leitor automático assim que o app abre
inicializarApp();

// --- 2. NAVEGAÇÃO E FILTRAGEM DINÂMICA ---
function mostrarTela(telaAtiva) {
    screenTheme.classList.remove('active');
    screenExpansion.classList.remove('active');
    screenSpawner.classList.remove('active');
    telaAtiva.classList.add('active');
}

// Quando clica em um TEMA (Era)
document.querySelectorAll('.btn-theme').forEach(botao => {
    botao.addEventListener('click', () => {
        const temaEscolhido = botao.getAttribute('data-theme').toLowerCase();
        
        // Limpa as listas da tela anterior
        listBaseGames.innerHTML = '';
        listExpansions.innerHTML = '';

        // Filtra os arquivos carregados que pertencem a este tema lendo o INSIDE do JSON
        const caixasDoTema = bancoDeDadosPreCarregado.filter(item => 
            item.dados.theme && item.dados.theme.toLowerCase() === temaEscolhido
        );

        // Separa dinamicamente Jogos Base de Expansões baseado na propriedade interna do JSON
        // (Ajuste o termo "box_type" ou "base" se o seu JSON usar palavras diferentes)
        // Pega os itens onde is_base_game é verdadeiro
        const bases = caixasDoTema.filter(item => item.dados.is_base_game);
            // Pega os itens onde is_base_game é falso (o ponto de exclamação inverte a checagem)
        const expansoes = caixasDoTema.filter(item => !item.dados.is_base_game);

        // Renderiza os Jogos Base encontrados
        if (bases.length === 0) listBaseGames.innerHTML = "<p>Nenhum jogo base encontrado para esta era.</p>";
        else bases.forEach(item => criarCheckbox(item, listBaseGames));

        // Renderiza as Expansões encontradas
        if (expansoes.length === 0) listExpansions.innerHTML = "<p>Nenhuma expansão encontrada para esta era.</p>";
        else expansoes.forEach(item => criarCheckbox(item, listExpansions));
        
        mostrarTela(screenExpansion);
    });
});

// Cria visualmente o checkbox na tela usando os metadados do próprio JSON
function criarCheckbox(item, containerAlvo) {
    const label = document.createElement('label');
    label.className = 'checkbox-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = item.arquivo; // O ID do checkbox é o nome do arquivo
    checkbox.setAttribute('data-name', item.dados.game_version); // O nome visível vem de dentro do JSON
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(item.dados.game_version));
    containerAlvo.appendChild(label);
}

// --- 3. FUSÃO MATEMÁTICA DOS DECK SELECIONADOS ---
btnConfirmLoad.addEventListener('click', () => {
    const marcados = screenExpansion.querySelectorAll('input[type="checkbox"]:checked');
    
    if (marcados.length === 0) {
        alert("Por favor, selecione ao menos um deck para jogar!");
        return;
    }

    const arquivosMarcados = Array.from(marcados).map(cb => cb.value);
    const nomesMarcados = Array.from(marcados).map(cb => cb.getAttribute('data-name'));

    // Inicializa a estrutura do super deck limpa
    baralhoZumbis = {
        special_spawns: { abominations: [], necromancers: [] },
        spawn_data: { blue: {}, yellow: {}, orange: {}, red: {} }
    };

    // Filtra na memória apenas os objetos que o usuário marcou e faz a fusão
    const jsonsParaMesclar = bancoDeDadosPreCarregado.filter(item => arquivosMarcados.includes(item.arquivo));

    jsonsParaMesclar.forEach(item => {
        const jsonAtual = item.dados;

        // Une os monstros especiais (Abominações e Necromantes)
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

        // Une a matemática dos Spawns por cores
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

    // Configura a tela final do Sorteador
    currentExpansionTitle.textContent = `Mesclado: ${nomesMarcados.join(' + ')}`;
    resultText.textContent = "Pronto para rodar!";
    bonusAbom = 0;
    bonusNecro = 0;
    mostrarTela(screenSpawner);
});

// Botões Voltar
document.getElementById('btn-back-to-theme').addEventListener('click', () => mostrarTela(screenTheme));
document.getElementById('btn-back-to-expansions').addEventListener('click', () => mostrarTela(screenExpansion));

// --- 4. MOTOR DE SORTEIO E TIMERS (INALTERADO E SEGURO) ---
const configEspeciais = {
    blue:   { abomBase: 0, abomInc: 0.5,   necroBase: 1, necroInc: 0.5 },
    yellow: { abomBase: 1, abomInc: 0.5,   necroBase: 2, necroInc: 1 },
    orange: { abomBase: 2, abomInc: 1,     necroBase: 4, necroInc: 1.5 },
    red:    { abomBase: 3, abomInc: 1,     necroBase: 5, necroInc: 1.5 }
};

let bonusAbom = 0;
let bonusNecro = 0;

btnDraw.addEventListener('click', () => {
    triggerFlash();
    const nivel = dangerLevel.value;
    const cartasDoNivel = baralhoZumbis.spawn_data[nivel];
    
    if (!cartasDoNivel) {
        resultText.textContent = `Sem dados para o nível ${nivel}.`;
        return; 
    }

    const listaAbom = baralhoZumbis.special_spawns?.abominations || [];
    const listaNecro = baralhoZumbis.special_spawns?.necromancers || [];
    const temAbom = listaAbom.length > 0;
    const temNecro = listaNecro.length > 0;

    const chanceFinalAbom = temAbom ? (configEspeciais[nivel].abomBase + bonusAbom) : 0;
    const chanceFinalNecro = temNecro ? (configEspeciais[nivel].necroBase + bonusNecro) : 0;
    const roleta = Math.random() * 100;

    // --- SORTEIO ABOMINAÇÃO CORRIGIDO ---
    if (roleta <= chanceFinalAbom) {
        const sorteado = listaAbom[Math.floor(Math.random() * listaAbom.length)];
        
        // Pega o display_name se for um pacote (novo JSON) ou o texto cru (JSON antigo)
        const nomeExibicao = typeof sorteado === 'object' ? sorteado.display_name : sorteado;
        
        resultText.textContent = `${nomeExibicao}`;
        bonusAbom = 0; 
        return; 
    }

    // --- SORTEIO NECROMANTE CORRIGIDO ---
    if (roleta <= (chanceFinalAbom + chanceFinalNecro)) {
        const sorteado = listaNecro[Math.floor(Math.random() * listaNecro.length)];
        
        const nomeExibicao = typeof sorteado === 'object' ? sorteado.display_name : sorteado;
        
        resultText.textContent = `${nomeExibicao}`;
        bonusNecro = 0; 
        return; 
    }

    if (temAbom) bonusAbom += configEspeciais[nivel].abomInc;
    if (temNecro) bonusNecro += configEspeciais[nivel].necroInc;

    // ... (restante do código) ...

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
        if (randTipo <= 0) {
            tipoSorteado = tipo;
            break;
        }
    }

    const grupoEscolhido = grupos[tipoSorteado];
    let randVariante = Math.random() * grupoEscolhido.totalPeso;
    let varianteSorteada, dadosVariante;
    
    for (const [variante, dados] of Object.entries(grupoEscolhido.variantes)) {
        randVariante -= dados.total_cards;
        if (randVariante <= 0) {
            varianteSorteada = variante;
            dadosVariante = dados;
            break;
        }
    }

    const dist = dadosVariante.qty_distribution;
    let pesoTotalQty = Object.values(dist).reduce((soma, peso) => soma + peso, 0);
    let randQty = Math.random() * pesoTotalQty;
    let quantidadeSorteada;

    for (const [quantidade, peso] of Object.entries(dist)) {
        randQty -= peso;
        if (randQty <= 0) {
            quantidadeSorteada = quantidade;
            break;
        }
    }

    const nomeFormatado = formatarNomeVisual(varianteSorteada);
    if (quantidadeSorteada === "0") {
        resultText.textContent = `${nomeFormatado}`;
    } else {
        resultText.textContent = `${quantidadeSorteada}x ${nomeFormatado}`;
    }
});

function triggerFlash() {
    appContainer.classList.add('flash-effect');
    setTimeout(() => { appContainer.classList.remove('flash-effect'); }, 150);
}

function formatarNomeVisual(texto) {
    return texto.split('_')
                .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
                .join(' ');
}