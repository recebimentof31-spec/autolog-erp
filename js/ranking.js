let configuracaoRanking = {
    pontuacaoMaxima: 100,
    notaMinima: 70,
    destacarCriticos: true
};

async function carregarConfiguracaoRanking() {

    try {

        const { data, error } = await supabaseClient
            .from("configuracoes")
            .select(`
    pontuacao_maxima,
    nota_minima,
    destacar_criticos
`)
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (data) {

            configuracaoRanking = {
    pontuacaoMaxima:
        Number(data.pontuacao_maxima) || 100,

    notaMinima:
        Number(data.nota_minima) || 70,

    destacarCriticos:
        data.destacar_criticos !== false
};

        }

        console.log(
            "Configuração do ranking carregada:",
            configuracaoRanking
        );

    }

    catch (erro) {

        console.error(
            "Erro ao carregar configuração do ranking:",
            erro
        );

    }

}

document.addEventListener("DOMContentLoaded", async () => {

    await carregarConfiguracaoRanking();

    await carregarRanking();

    configurarFiltrosRanking();

    configurarAbasRanking();

    configurarRankingMensal();

});

let rankingBase = [];


// =====================================================
// CARREGA DADOS DO RANKING
// =====================================================

async function carregarRanking() {

    const { data, error } = await supabaseClient
        .from("avaliacoes_semanais")
        .select(`
            id,
            funcionario_id,
            nota_final,
            classificacao,
            semana,
            competencia,
            periodo_inicio,
            periodo_fim,
            created_at,
            status,
            funcionarios (
    nome,
    matricula,
    avatar_url
)
        `)
        .eq("status", "enviada")
        .order("created_at", {
            ascending: false
        });

    if (error) {
        console.error(
            "Erro ao carregar ranking:",
            error
        );

        mostrarErroRanking();

        return;
    }

    rankingBase = data || [];

    atualizarRankingCompleto();
}


// =====================================================
// CONFIGURA FILTROS
// =====================================================

function configurarFiltrosRanking() {

    const busca =
        document.getElementById(
            "rankingBusca"
        );

    const periodo =
        document.getElementById(
            "rankingPeriodo"
        );

    const classificacao =
        document.getElementById(
            "rankingClassificacao"
        );


    if (busca) {
        busca.addEventListener(
            "input",
            atualizarRankingCompleto
        );
    }


    if (periodo) {
        periodo.addEventListener(
            "change",
            atualizarRankingCompleto
        );
    }


    if (classificacao) {
        classificacao.addEventListener(
            "change",
            atualizarRankingCompleto
        );
    }
}


// =====================================================
// ATUALIZA TODO O RANKING
// =====================================================

function atualizarRankingCompleto() {

    const avaliacoesFiltradas =
        aplicarFiltros(
            rankingBase
        );

    const rankingCompleto =
        montarRanking(
            avaliacoesFiltradas
        );

    const ranking =
        aplicarFiltroClassificacaoRanking(
            rankingCompleto
        );

    atualizarPodio(ranking);

    atualizarKPIs(
        ranking,
        avaliacoesFiltradas
    );

    atualizarTabela(ranking);

    atualizarQuantidadeResultados(
        ranking
    );
}

// =====================================================
// APLICA FILTROS
// =====================================================

function aplicarFiltros(avaliacoes) {

    const busca =
        document.getElementById(
            "rankingBusca"
        )?.value
            ?.trim()
            ?.toLowerCase()
        || "";

    const periodo =
        document.getElementById(
            "rankingPeriodo"
        )?.value
        || "todos";

    const agora =
        new Date();

    return avaliacoes.filter(
        avaliacao => {

            const nome =
                avaliacao
                    .funcionarios
                    ?.nome
                    ?.toLowerCase()
                || "";

            const matricula =
                String(
                    avaliacao
                        .funcionarios
                        ?.matricula
                    || ""
                ).toLowerCase();

            const atendeBusca =
                !busca
                ||
                nome.includes(busca)
                ||
                matricula.includes(busca);

            let atendePeriodo =
                true;

            if (
                periodo !== "todos"
            ) {

                const dias =
                    Number(periodo);

                const dataAvaliacao =
                    new Date(
                        avaliacao.created_at
                        ||
                        avaliacao.periodo_fim
                    );

                const limite =
                    new Date();

                limite.setDate(
                    agora.getDate() - dias
                );

                atendePeriodo =
                    !Number.isNaN(
                        dataAvaliacao.getTime()
                    )
                    &&
                    dataAvaliacao >= limite;
            }

            return (
                atendeBusca
                &&
                atendePeriodo
            );
        }
    );
}


// =====================================================
// MONTA RANKING POR COLABORADOR
// =====================================================

function montarRanking(avaliacoes) {

    const agrupado = {};


    avaliacoes.forEach(
        avaliacao => {

            const funcionarioId =
                avaliacao.funcionario_id;


            if (
                !agrupado[funcionarioId]
            ) {

                agrupado[funcionarioId] = {

                    funcionario_id:
                        funcionarioId,

                    nome:
                        avaliacao
                            .funcionarios
                            ?.nome
                        || "Funcionário",

                    matricula:
    avaliacao
        .funcionarios
        ?.matricula
    || "-",

avatar_url:
    avaliacao
        .funcionarios
        ?.avatar_url
    || null,

soma:
    0,

                    quantidade:
                        0,

                    ultimaAvaliacao:
                        null,

                    ultimaNota:
                        0

                };
            }


            const nota =
                Number(
                    avaliacao.nota_final
                    || 0
                );


            agrupado[
                funcionarioId
            ].soma += nota;


            agrupado[
                funcionarioId
            ].quantidade++;


            const dataAtual =
                new Date(
                    avaliacao.created_at
                    ||
                    avaliacao.periodo_fim
                );


            const item =
                agrupado[
                    funcionarioId
                ];


            if (
                !item.ultimaAvaliacao
                ||
                dataAtual >
                new Date(
                    item.ultimaAvaliacao
                )
            ) {

                item.ultimaAvaliacao =
                    avaliacao.created_at
                    ||
                    avaliacao.periodo_fim;

                item.ultimaNota =
                    nota;
            }
        }
    );


    const ranking =
        Object.values(
            agrupado
        )
            .map(
                item => {

                    const media =
                        item.quantidade
                            ? item.soma /
                              item.quantidade
                            : 0;


                    return {

                        funcionario_id:
                            item.funcionario_id,

                        nome:
                            item.nome,

                        matricula:
    item.matricula,

avatar_url:
    item.avatar_url,

quantidade:
    item.quantidade,

                        media:
                            Number(
                                media.toFixed(1)
                            ),

                        classificacao:
                            obterClassificacaoPorNota(
                                media
                            ),

                        ultimaAvaliacao:
                            item.ultimaAvaliacao,

                        ultimaNota:
                            item.ultimaNota

                    };
                }
            )
            .sort(
                (a, b) => {

                    if (
                        b.media !== a.media
                    ) {
                        return (
                            b.media -
                            a.media
                        );
                    }

                    return (
                        b.quantidade -
                        a.quantidade
                    );
                }
            );


    return ranking;
}

// =====================================================
// FILTRA PELA CLASSIFICAÇÃO DA MÉDIA FINAL
// =====================================================

function aplicarFiltroClassificacaoRanking(
    ranking
) {

    const classificacao =
        document.getElementById(
            "rankingClassificacao"
        )?.value
        || "todas";

    if (
        classificacao === "todas"
    ) {
        return ranking;
    }

    return ranking.filter(
        colaborador =>
            colaborador.classificacao
            === classificacao
    );
}


// =====================================================
// ATUALIZA PÓDIO
// =====================================================

function atualizarPodio(ranking) {

    const container =
        document.getElementById(
            "rankingPodio"
        );

    if (!container) {
        return;
    }


    if (
        ranking.length === 0
    ) {

        container.innerHTML = `
            <div class="ranking-loading">
                Nenhum colaborador encontrado.
            </div>
        `;

        return;
    }


    const primeiro =
        ranking[0]
        || null;

    const segundo =
        ranking[1]
        || null;

    const terceiro =
        ranking[2]
        || null;


    container.innerHTML = `

        ${criarCardPodio(
            segundo,
            2
        )}

        ${criarCardPodio(
            primeiro,
            1
        )}

        ${criarCardPodio(
            terceiro,
            3
        )}

    `;
}


// =====================================================
// CRIA CARD DO PÓDIO
// =====================================================

// =====================================================
// AVATAR DO PÓDIO
// =====================================================

function criarAvatarPodio(
    nome,
    avatarUrl,
    posicao
) {

    const possuiColaborador =
    Boolean(
        String(nome || "").trim()
    );

const nomeSeguro =
    possuiColaborador
        ? String(nome).trim()
        : "Posição disponível";

const iniciais =
    possuiColaborador
        ? nomeSeguro
            .split(/\s+/)
            .slice(0, 2)
            .map(
                parte =>
                    parte.charAt(0)
            )
            .join("")
            .toUpperCase()
        : "👤";

    let medalha = "🥉";

    if (posicao === 1) {
        medalha = "🥇";
    }

    if (posicao === 2) {
        medalha = "🥈";
    }

    const imagem =
        avatarUrl
            ? `
                <img
                    src="${avatarUrl}"
                    alt="Foto de ${nomeSeguro}"
                    loading="lazy"
                    onerror="this.remove()"
                >
            `
            : "";

    return `
        <div
            class="
                podium-avatar
                podium-avatar-${posicao}
            "
        >
            <span class="podium-avatar-fallback">
                ${iniciais}
            </span>

            ${imagem}

            <span
                class="podium-avatar-medal"
                title="${posicao}º lugar"
            >
                ${medalha}
            </span>
        </div>
    `;
}

function criarCardPodio(
    colaborador,
    posicao
) {

    if (!colaborador) {

        return `
            <article
                class="
                    ranking-podium-card
                    ranking-podium-empty
                "
            >

                ${criarAvatarPodio(
    null,
    null,
    posicao
)}

                <strong>
                    Sem dados
                </strong>

                <small>
                    Aguardando avaliações
                </small>

            </article>
        `;
    }

    return `
        <article
            class="
                ranking-podium-card
                podium-${posicao}
            "
        >

            ${criarAvatarPodio(
    colaborador.nome,
    colaborador.avatar_url,
    posicao
)}

            <strong
                class="
                    podium-name
                "
            >
                ${colaborador.nome}
            </strong>

            <small
                class="
                    podium-matricula
                "
            >
                ${colaborador.matricula}
            </small>

            <div
                class="
                    podium-score
                "
            >
                ${colaborador.media}
            </div>

            <span
                class="
                    ${classeClassificacao(
                        colaborador
                            .classificacao
                    )}
                "
            >
                ${colaborador.classificacao}
            </span>

            <small
                class="
                    podium-avaliacoes
                "
            >
                ${colaborador.quantidade}
                avaliação(ões)
            </small>

        </article>
    `;
}


// =====================================================
// ATUALIZA KPIs
// =====================================================

function atualizarKPIs(
    ranking,
    avaliacoes
) {

    definirTextoRanking(
        "rankingTotalColaboradores",
        ranking.length
    );


    definirTextoRanking(
        "rankingTotalAvaliacoes",
        avaliacoes.length
    );


    let mediaEquipe = 0;


    if (
        avaliacoes.length > 0
    ) {

        const soma =
            avaliacoes.reduce(
                (
                    total,
                    avaliacao
                ) =>
                    total +
                    Number(
                        avaliacao
                            .nota_final
                        || 0
                    ),
                0
            );


        mediaEquipe =
            soma /
            avaliacoes.length;
    }


    definirTextoRanking(
        "rankingMediaEquipe",
        mediaEquipe.toFixed(1)
    );


    const melhorMedia =
        ranking.length > 0
            ? ranking[0].media
            : 0;


    definirTextoRanking(
        "rankingMelhorMedia",
        Number(
            melhorMedia
        ).toFixed(1)
    );
}


// =====================================================
// ATUALIZA TABELA
// =====================================================

function atualizarTabela(ranking) {

    const tbody =
        document.getElementById(
            "rankingTabelaCorpo"
        );

    if (!tbody) {
        return;
    }


    if (
        ranking.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="
                        ranking-empty-row
                    "
                >
                    Nenhum colaborador encontrado.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        ranking
            .map(
                (
                    colaborador,
                    indice
                ) => {

                    const posicao =
    indice + 1;


const destacarLinhaCritica =
    configuracaoRanking.destacarCriticos
    &&
    colaborador.classificacao === "CRÍTICO";


return `
    <tr
        class="${
            destacarLinhaCritica
                ? "ranking-row-critico"
                : ""
        }"
    >


                            <td>
                                <span
                                    class="
                                        ranking-table-position
                                    "
                                >
                                    ${posicao}
                                </span>
                            </td>


                            <td>

                                <div class="ranking-table-person">

    ${criarAvatarTabelaRanking(
        colaborador.nome,
        colaborador.avatar_url
    )}

    <div class="ranking-table-person-info">

        <strong>
            ${colaborador.nome}
        </strong>

        <small>
            Matrícula:
            ${colaborador.matricula}
        </small>

    </div>

</div>

                            </td>


                            <td>
                                ${colaborador.quantidade}
                            </td>


                            <td>

                                <strong
                                    class="
                                        ranking-table-score
                                    "
                                >
                                    ${colaborador.media}
                                </strong>

                            </td>


                            <td>

                                <span
                                    class="
                                        ${classeClassificacao(
                                            colaborador
                                                .classificacao
                                        )}
                                    "
                                >
                                    ${colaborador.classificacao}
                                </span>

                            </td>


                            <td>

                                ${formatarDataRanking(
                                    colaborador
                                        .ultimaAvaliacao
                                )}

                            </td>

                        </tr>
                    `;
                }
            )
            .join("");
}


// =====================================================
// QUANTIDADE DE RESULTADOS
// =====================================================

function atualizarQuantidadeResultados(
    ranking
) {

    const elemento =
        document.getElementById(
            "rankingQuantidadeResultados"
        );

    if (!elemento) {
        return;
    }


    const quantidade =
        ranking.length;


    elemento.textContent =
        quantidade === 1
            ? "1 colaborador"
            : `${quantidade} colaboradores`;
}


// =====================================================
// CLASSIFICAÇÃO
// =====================================================

function obterClassificacaoPorNota(nota) {

    const valor =
        Number(nota || 0);

    const pontuacaoMaxima =
        Number(
            configuracaoRanking.pontuacaoMaxima
        ) || 100;

    const notaMinima =
        Number(
            configuracaoRanking.notaMinima
        ) || 70;

    const limiteExcelente =
        pontuacaoMaxima * 0.90;

    const limiteMuitoBom =
        pontuacaoMaxima * 0.80;

    const limiteBom =
        notaMinima;

    const limiteAtencao =
        Math.max(
            0,
            notaMinima - 10
        );

    if (valor >= limiteExcelente) {
        return "EXCELENTE";
    }

    if (valor >= limiteMuitoBom) {
        return "MUITO BOM";
    }

    if (valor >= limiteBom) {
        return "BOM";
    }

    if (valor >= limiteAtencao) {
        return "ATENÇÃO";
    }

    return "CRÍTICO";
}

// =====================================================
// CLASSE VISUAL DA CLASSIFICAÇÃO
// =====================================================

function classeClassificacao(
    classificacao
) {

    switch (
        classificacao
    ) {

        case "EXCELENTE":
            return "ranking-status excelente";

        case "MUITO BOM":
            return "ranking-status muito-bom";

        case "BOM":
            return "ranking-status bom";

        case "ATENÇÃO":
            return "ranking-status atencao";

        default:
            return "ranking-status critico";
    }
}


// =====================================================
// FORMATA DATA
// =====================================================

function formatarDataRanking(
    dataISO
) {

    if (!dataISO) {
        return "-";
    }


    return new Date(
        dataISO
    ).toLocaleDateString(
        "pt-BR",
        {
            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric"
        }
    );
}


// =====================================================
// DEFINE TEXTO
// =====================================================

function definirTextoRanking(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );


    if (elemento) {
        elemento.textContent =
            valor;
    }
}


// =====================================================
// MENSAGEM DE ERRO
// =====================================================

function mostrarErroRanking() {

    const podio =
        document.getElementById(
            "rankingPodio"
        );

    const tabela =
        document.getElementById(
            "rankingTabelaCorpo"
        );


    if (podio) {

        podio.innerHTML = `
            <div class="ranking-loading">
                Não foi possível carregar o ranking.
            </div>
        `;
    }


    if (tabela) {

        tabela.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="
                        ranking-empty-row
                    "
                >
                    Não foi possível carregar os dados.
                </td>
            </tr>
        `;
    }
}

// =====================================================
// RANKING MENSAL
// =====================================================

let rankingMensalBase = [];


// =====================================================
// CONFIGURA ABAS DO RANKING
// =====================================================

// =====================================================
// CONFIGURA ABAS DO RANKING
// =====================================================

// =====================================================
// CONFIGURA ABAS DO RANKING
// =====================================================

// =====================================================
// CONFIGURA ABAS DO RANKING
// =====================================================

function configurarAbasRanking() {

    const botaoDesempenho =
        document.getElementById(
            "tabRankingDesempenho"
        );

    const botaoMensal =
        document.getElementById(
            "tabRankingMensal"
        );

    const painelDesempenho =
        document.getElementById(
            "painelRankingDesempenho"
        );

    const painelMensal =
        document.getElementById(
            "painelRankingMensal"
        );


    if (
        !botaoDesempenho ||
        !botaoMensal ||
        !painelDesempenho ||
        !painelMensal
    ) {

        console.error(
            "Erro ao configurar abas do Ranking:",
            {
                botaoDesempenho,
                botaoMensal,
                painelDesempenho,
                painelMensal
            }
        );

        return;
    }


    // =================================================
    // ABRE ABA DE DESEMPENHO
    // =================================================

    botaoDesempenho.onclick = () => {

        botaoDesempenho.classList.add(
            "active"
        );

        botaoMensal.classList.remove(
            "active"
        );


        painelDesempenho.classList.add(
            "active"
        );

        painelMensal.classList.remove(
            "active"
        );


        painelDesempenho.style.display =
            "block";

        painelMensal.style.display =
            "none";


        atualizarRankingCompleto();

    };


    // =================================================
    // ABRE ABA DE RANKING MENSAL
    // =================================================

    botaoMensal.onclick = async () => {

        botaoMensal.classList.add(
            "active"
        );

        botaoDesempenho.classList.remove(
            "active"
        );


        painelMensal.classList.add(
            "active"
        );

        painelDesempenho.classList.remove(
            "active"
        );


        painelMensal.style.display =
            "block";

        painelDesempenho.style.display =
            "none";


        await carregarRankingMensal();

    };


    // =================================================
    // ESTADO INICIAL
    // =================================================

    botaoDesempenho.classList.add(
        "active"
    );

    botaoMensal.classList.remove(
        "active"
    );

    painelDesempenho.style.display =
        "block";

    painelMensal.style.display =
        "none";


    console.log(
        "Abas do Ranking configuradas com sucesso!"
    );

}

// =====================================================
// CONFIGURA COMPETÊNCIA DO RANKING MENSAL
// =====================================================

function configurarRankingMensal() {

    const campo =
        document.getElementById(
            "rankingMensalCompetencia"
        );


    if (!campo) {
        return;
    }


    if (!campo.value) {

        const hoje =
            new Date();


        const ano =
            hoje.getFullYear();


        const mes =
            String(
                hoje.getMonth() + 1
            ).padStart(2, "0");


        campo.value =
            `${ano}-${mes}`;

    }


    campo.addEventListener(
        "change",
        carregarRankingMensal
    );

}


// =====================================================
// CARREGA RANKING MENSAL
// =====================================================

async function carregarRankingMensal() {

    const campo =
        document.getElementById(
            "rankingMensalCompetencia"
        );


    if (!campo) {
        return;
    }


    const competencia =
        campo.value;


    if (!competencia) {

        rankingMensalBase = [];

        atualizarRankingMensal();

        return;
    }


    const [
        anoTexto,
        mesTexto
    ] =
        competencia.split("-");


    const ano =
        Number(
            anoTexto
        );


    const mes =
        Number(
            mesTexto
        );


    mostrarCarregandoRankingMensal();


    try {

        const {
            data: fechamentos,
            error: erroFechamentos
        } =
            await supabaseClient

                .from(
                    "fechamentos_mensais"
                )

                .select(`
                    id,
                    funcionario_id,
                    ano,
                    mes,
                    media_tecnica,
                    nota_gestor,
                    classificacao,
                    status,
                    fechado_em
                `)

                .eq(
                    "ano",
                    ano
                )

                .eq(
                    "mes",
                    mes
                )

                .eq(
                    "status",
                    "fechado"
                )

                .order(
                    "media_tecnica",
                    {
                        ascending:
                            false
                    }
                );


        if (erroFechamentos) {
            throw erroFechamentos;
        }


        const lista =
            fechamentos
            || [];


        const idsFuncionarios =
            [
                ...new Set(
                    lista

                        .map(
                            item =>
                                item.funcionario_id
                        )

                        .filter(
                            Boolean
                        )
                )
            ];


        let mapaFuncionarios =
            {};


        if (
            idsFuncionarios.length > 0
        ) {

            const {
                data: funcionarios,
                error: erroFuncionarios
            } =
                await supabaseClient

                    .from(
                        "funcionarios"
                    )

                    .select(`
    id,
    nome,
    matricula,
    avatar_url
`)

                    .in(
                        "id",
                        idsFuncionarios
                    );


            if (erroFuncionarios) {
                throw erroFuncionarios;
            }


            (
                funcionarios
                || []
            ).forEach(
                funcionario => {

                    mapaFuncionarios[
                        funcionario.id
                    ] =
                        funcionario;

                }
            );

        }


        rankingMensalBase =
            lista.map(
                item => ({

                    ...item,

                    funcionario:
                        mapaFuncionarios[
                            item.funcionario_id
                        ]
                        || null

                })
            );


        atualizarRankingMensal();

    }

    catch (erro) {

        console.error(
            "Erro ao carregar ranking mensal:",
            erro
        );


        rankingMensalBase =
            [];


        mostrarErroRankingMensal();

    }

}


// =====================================================
// ATUALIZA RANKING MENSAL
// =====================================================

function atualizarRankingMensal() {

    atualizarPodioMensal();

    atualizarKPIsMensais();

    atualizarTabelaMensal();

    atualizarQuantidadeMensal();

}


// =====================================================
// PÓDIO MENSAL
// =====================================================

function atualizarPodioMensal() {

    const container =
        document.getElementById(
            "rankingMensalPodio"
        );


    if (!container) {
        return;
    }


    if (
        rankingMensalBase.length === 0
    ) {

        container.innerHTML = `
            <div class="ranking-loading">
                Nenhum fechamento encontrado
                para esta competência.
            </div>
        `;

        return;
    }


    const primeiro =
        rankingMensalBase[0]
        || null;


    const segundo =
        rankingMensalBase[1]
        || null;


    const terceiro =
        rankingMensalBase[2]
        || null;


    container.innerHTML = `

        ${criarCardPodioMensal(
            segundo,
            2
        )}

        ${criarCardPodioMensal(
            primeiro,
            1
        )}

        ${criarCardPodioMensal(
            terceiro,
            3
        )}

    `;

}


// =====================================================
// CARD DO PÓDIO MENSAL
// =====================================================

function criarCardPodioMensal(
    item,
    posicao
) {

    if (!item) {

        return `
            <article
                class="
                    ranking-podium-card
                    ranking-podium-empty
                "
            >

                ${criarAvatarPodio(
    null,
    null,
    posicao
)}

                <strong>
                    Sem dados
                </strong>

                <small>
                    Aguardando fechamento
                </small>

            </article>
        `;
    }

    const nome =
        item.funcionario?.nome
        || "Funcionário";


    const matricula =
        item.funcionario?.matricula
        || "-";


    const media =
        Number(
            item.media_tecnica
            || 0
        );


    const classificacao =
        item.classificacao
        ||
        obterClassificacaoPorNota(
            media
        );


    return `
        <article
            class="
                ranking-podium-card
                podium-${posicao}
            "
        >

            ${criarAvatarPodio(
    nome,
    item.funcionario?.avatar_url,
    posicao
)}

            <strong class="podium-name">
                ${nome}
            </strong>

            <small class="podium-matricula">
                ${matricula}
            </small>

            <div class="podium-score">
                ${media.toFixed(1)}
            </div>

            <span
                class="
                    ${classeClassificacao(
                        classificacao
                    )}
                "
            >
                ${classificacao}
            </span>

            <small class="podium-avaliacoes">
                Fechamento mensal
            </small>

        </article>
    `;
    }

    // =====================================================
// AVATAR DA TABELA DO RANKING
// =====================================================

function criarAvatarTabelaRanking(
    nome,
    avatarUrl
) {

    const nomeSeguro =
        String(
            nome || "Funcionário"
        ).trim();

    const iniciais =
        nomeSeguro
            .split(/\s+/)
            .slice(0, 2)
            .map(
                parte =>
                    parte.charAt(0)
            )
            .join("")
            .toUpperCase()
        || "F";

    const imagem =
        avatarUrl
            ? `
                <img
                    src="${avatarUrl}"
                    alt="Foto de ${nomeSeguro}"
                    loading="lazy"
                    onerror="this.remove()"
                >
            `
            : "";

    return `
        <span class="ranking-table-avatar">
            <span class="ranking-table-avatar-fallback">
                ${iniciais}
            </span>

            ${imagem}
        </span>
    `;
}

// =====================================================
// KPIs MENSAIS
// =====================================================

function atualizarKPIsMensais() {

    const quantidade =
        rankingMensalBase.length;


    definirTextoRanking(
        "rankingMensalTotalColaboradores",
        quantidade
    );


    definirTextoRanking(
        "rankingMensalTotalFechamentos",
        quantidade
    );


    if (
        quantidade === 0
    ) {

        definirTextoRanking(
            "rankingMensalMediaEquipe",
            "0.0"
        );


        definirTextoRanking(
            "rankingMensalMelhorMedia",
            "0.0"
        );


        return;
    }


    const medias =
        rankingMensalBase.map(
            item =>
                Number(
                    item.media_tecnica
                    || 0
                )
        );


    const soma =
        medias.reduce(
            (
                total,
                media
            ) =>
                total
                +
                media,
            0
        );


    const mediaEquipe =
        soma
        /
        medias.length;


    const melhorMedia =
        Math.max(
            ...medias
        );


    definirTextoRanking(
        "rankingMensalMediaEquipe",
        mediaEquipe.toFixed(1)
    );


    definirTextoRanking(
        "rankingMensalMelhorMedia",
        melhorMedia.toFixed(1)
    );

}


// =====================================================
// TABELA MENSAL
// =====================================================

function atualizarTabelaMensal() {

    const tbody =
        document.getElementById(
            "rankingMensalTabelaCorpo"
        );


    if (!tbody) {
        return;
    }


    if (
        rankingMensalBase.length === 0
    ) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="6"
                    class="ranking-empty-row"
                >
                    Nenhum fechamento encontrado
                    para esta competência.
                </td>

            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        rankingMensalBase

            .map(
                (
                    item,
                    indice
                ) => {

                    const posicao =
                        indice + 1;


                    const nome =
                        item.funcionario?.nome
                        || "Funcionário";


                    const matricula =
                        item.funcionario?.matricula
                        || "-";


                    const media =
                        Number(
                            item.media_tecnica
                            || 0
                        );


                    const notaGestor =
                        item.nota_gestor
                        === null
                        ||
                        item.nota_gestor
                        === undefined

                            ? "-"

                            : Number(
                                item.nota_gestor
                            ).toFixed(1);


                    const classificacao =
                        item.classificacao
                        ||
                        obterClassificacaoPorNota(
                            media
                        );


                    const status =
    String(
        item.status
        || ""
    ).toUpperCase();


const destacarLinhaCritica =
    configuracaoRanking.destacarCriticos
    &&
    classificacao === "CRÍTICO";


return `
    <tr
        class="${
            destacarLinhaCritica
                ? "ranking-row-critico"
                : ""
        }"
    >

                            <td>

                                <span
                                    class="
                                        ranking-table-position
                                    "
                                >
                                    ${posicao}
                                </span>

                            </td>


                            <td>

                                <div class="ranking-table-person">

    ${criarAvatarTabelaRanking(
        nome,
        item.funcionario?.avatar_url
    )}

    <div class="ranking-table-person-info">

        <strong>
            ${nome}
        </strong>

        <small>
            Matrícula:
            ${matricula}
        </small>

    </div>

</div>

                            </td>


                            <td>

                                <strong
                                    class="
                                        ranking-table-score
                                    "
                                >
                                    ${media.toFixed(1)}
                                </strong>

                            </td>


                            <td>
                                ${notaGestor}
                            </td>


                            <td>

                                <span
                                    class="
                                        ${classeClassificacao(
                                            classificacao
                                        )}
                                    "
                                >
                                    ${classificacao}
                                </span>

                            </td>


                            <td>
                                ${status}
                            </td>

                        </tr>
                    `;

                }
            )

            .join("");

}


// =====================================================
// QUANTIDADE MENSAL
// =====================================================

function atualizarQuantidadeMensal() {

    const elemento =
        document.getElementById(
            "rankingMensalQuantidadeResultados"
        );


    if (!elemento) {
        return;
    }


    const quantidade =
        rankingMensalBase.length;


    elemento.textContent =
        quantidade === 1

            ? "1 colaborador"

            : `${quantidade} colaboradores`;

}


// =====================================================
// CARREGANDO RANKING MENSAL
// =====================================================

function mostrarCarregandoRankingMensal() {

    const podio =
        document.getElementById(
            "rankingMensalPodio"
        );


    const tabela =
        document.getElementById(
            "rankingMensalTabelaCorpo"
        );


    if (podio) {

        podio.innerHTML = `
            <div class="ranking-loading">
                Carregando ranking mensal...
            </div>
        `;

    }


    if (tabela) {

        tabela.innerHTML = `
            <tr>

                <td
                    colspan="6"
                    class="ranking-empty-row"
                >
                    Carregando dados...
                </td>

            </tr>
        `;

    }

}


// =====================================================
// ERRO NO RANKING MENSAL
// =====================================================

function mostrarErroRankingMensal() {

    const podio =
        document.getElementById(
            "rankingMensalPodio"
        );


    const tabela =
        document.getElementById(
            "rankingMensalTabelaCorpo"
        );


    if (podio) {

        podio.innerHTML = `
            <div class="ranking-loading">
                Não foi possível carregar
                o ranking mensal.
            </div>
        `;

    }


    if (tabela) {

        tabela.innerHTML = `
            <tr>

                <td
                    colspan="6"
                    class="ranking-empty-row"
                >
                    Não foi possível carregar
                    os dados mensais.
                </td>

            </tr>
        `;

    }


    definirTextoRanking(
        "rankingMensalTotalColaboradores",
        "0"
    );


    definirTextoRanking(
        "rankingMensalMediaEquipe",
        "0.0"
    );


    definirTextoRanking(
        "rankingMensalMelhorMedia",
        "0.0"
    );


    definirTextoRanking(
        "rankingMensalTotalFechamentos",
        "0"
    );

}