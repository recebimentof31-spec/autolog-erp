let configuracaoRanking = {
    pontuacaoMaxima: 100,
    notaMinima: 70
};

async function carregarConfiguracaoRanking() {

    try {

        const { data, error } = await supabaseClient
            .from("configuracoes")
            .select(`
                pontuacao_maxima,
                nota_minima
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
                    Number(data.nota_minima) || 70
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
                matricula
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

    const ranking =
        montarRanking(
            avaliacoesFiltradas
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

    const classificacao =
        document.getElementById(
            "rankingClassificacao"
        )?.value
        || "todas";


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
                    dataAvaliacao >= limite;
            }


            let atendeClassificacao =
                true;


            if (
                classificacao !== "todas"
            ) {

                const classe =
                    obterClassificacaoPorNota(
                        Number(
                            avaliacao.nota_final
                            || 0
                        )
                    );

                atendeClassificacao =
                    classe === classificacao;
            }


            return (
                atendeBusca
                &&
                atendePeriodo
                &&
                atendeClassificacao
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

                <span class="podium-position">
                    ${posicao}º
                </span>

                <strong>
                    Sem dados
                </strong>

                <small>
                    Aguardando avaliações
                </small>

            </article>
        `;
    }


    let medalha =
        "🥉";


    if (posicao === 1) {
        medalha = "🥇";
    }

    if (posicao === 2) {
        medalha = "🥈";
    }


    return `
        <article
            class="
                ranking-podium-card
                podium-${posicao}
            "
        >

            <div
                class="
                    podium-medal
                "
            >
                ${medalha}
            </div>

            <span
                class="
                    podium-position
                "
            >
                ${posicao}º lugar
            </span>

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


                    return `
                        <tr>

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

                                <div
                                    class="
                                        ranking-table-person
                                    "
                                >

                                    <strong>
                                        ${colaborador.nome}
                                    </strong>

                                    <small>
                                        Matrícula:
                                        ${colaborador.matricula}
                                    </small>

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