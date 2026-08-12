// =====================================================
// CONFIGURAÇÃO DO DASHBOARD
// =====================================================

let configuracaoDashboard = {
    pontuacaoMaxima: 100,
    notaMinima: 70
};

let dashboardAvaliacoesBase = [];

let graficoEvolucaoInstance = null;


// =====================================================
// INICIALIZAÇÃO
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        configurarFiltroPeriodoDashboard();

        await carregarConfiguracaoDashboard();

        await Promise.all([
            carregarFuncionariosAtivos(),
            carregarAvaliacoesDashboard(),
            carregarDestaqueDoMes()
        ]);

    }
);


// =====================================================
// CONFIGURAÇÃO DO SISTEMA
// =====================================================

async function carregarConfiguracaoDashboard() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient

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

            configuracaoDashboard = {

                pontuacaoMaxima:
                    Number(
                        data.pontuacao_maxima
                    ) || 100,

                notaMinima:
                    Number(
                        data.nota_minima
                    ) || 70

            };

        }

    }

    catch (erro) {

        console.error(
            "Erro ao carregar configuração do dashboard:",
            erro
        );

    }

}


// =====================================================
// FUNCIONÁRIOS ATIVOS
// =====================================================

async function carregarFuncionariosAtivos() {

    const {
        count,
        error
    } =
        await supabaseClient

            .from("funcionarios")

            .select(
                "*",
                {
                    count: "exact",
                    head: true
                }
            )

            .eq(
                "status",
                "Ativo"
            );


    if (error) {

        console.error(
            "Erro ao contar funcionários:",
            error
        );

        return;
    }


    definirTextoDashboard(
        "kpiFuncionarios",
        count || 0
    );

}


// =====================================================
// CARREGA AVALIAÇÕES
// =====================================================

async function carregarAvaliacoesDashboard() {

    const {
        data,
        error
    } =
        await supabaseClient

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

            .eq(
                "status",
                "enviada"
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Erro ao carregar avaliações do dashboard:",
            error
        );

        return;
    }


    dashboardAvaliacoesBase =
        data || [];


    atualizarDashboardPorPeriodo();

}


// =====================================================
// FILTRO DE PERÍODO
// =====================================================

function configurarFiltroPeriodoDashboard() {

    const campo =
        document.getElementById(
            "dashboardPeriodo"
        );


    if (!campo) {
        return;
    }


    campo.addEventListener(
        "change",
        atualizarDashboardPorPeriodo
    );

}


// =====================================================
// APLICA FILTRO E ATUALIZA DASHBOARD
// =====================================================

function atualizarDashboardPorPeriodo() {

    const avaliacoes =
        filtrarAvaliacoesDashboard(
            dashboardAvaliacoesBase
        );


    atualizarQuantidadeAvaliacoes(
        avaliacoes
    );

    atualizarMediaGeral(
        avaliacoes
    );

    atualizarClassificacoes(
        avaliacoes
    );

    atualizarRankingDashboard(
        avaliacoes
    );

    atualizarUltimasAvaliacoes(
        avaliacoes
    );

    atualizarGraficoEvolucao(
        avaliacoes
    );

}


// =====================================================
// FILTRA AVALIAÇÕES PELO PERÍODO
// =====================================================

function filtrarAvaliacoesDashboard(
    avaliacoes
) {

    const campo =
        document.getElementById(
            "dashboardPeriodo"
        );


    if (!campo) {
        return avaliacoes;
    }


    const texto =
        String(
            campo.value
            ||
            campo.options[
                campo.selectedIndex
            ]?.text
            ||
            ""
        );


    const correspondencia =
        texto.match(/\d+/);


    if (!correspondencia) {
        return avaliacoes;
    }


    const dias =
        Number(
            correspondencia[0]
        );


    if (!dias) {
        return avaliacoes;
    }


    const agora =
        new Date();


    const limite =
        new Date();


    limite.setDate(
        agora.getDate()
        -
        dias
    );


    return avaliacoes.filter(
        avaliacao => {

            const dataISO =
                avaliacao.created_at
                ||
                avaliacao.periodo_fim
                ||
                avaliacao.periodo_inicio;


            if (!dataISO) {
                return false;
            }


            const data =
                new Date(
                    dataISO
                );


            return (
                data >= limite
                &&
                data <= agora
            );

        }
    );

}


// =====================================================
// QUANTIDADE DE AVALIAÇÕES
// =====================================================

function atualizarQuantidadeAvaliacoes(
    avaliacoes
) {

    definirTextoDashboard(
        "kpiAvaliacoes",
        avaliacoes.length
    );

}


// =====================================================
// MÉDIA GERAL
// =====================================================

function atualizarMediaGeral(
    avaliacoes
) {

    let media =
        0;


    if (
        avaliacoes.length > 0
    ) {

        const soma =
            avaliacoes.reduce(
                (
                    total,
                    avaliacao
                ) =>
                    total
                    +
                    Number(
                        avaliacao.nota_final
                        || 0
                    ),
                0
            );


        media =
            soma
            /
            avaliacoes.length;

    }


    const valor =
        media.toFixed(1);


    definirTextoDashboard(
        "kpiMedia",
        valor
    );


    definirTextoDashboard(
        "dashboardNotaMedia",
        valor
    );

}


// =====================================================
// CLASSIFICAÇÃO OFICIAL
// =====================================================

function obterClassificacaoDashboard(
    nota
) {

    const valor =
        Number(
            nota || 0
        );


    const pontuacaoMaxima =
        Number(
            configuracaoDashboard
                .pontuacaoMaxima
        ) || 100;


    const notaMinima =
        Number(
            configuracaoDashboard
                .notaMinima
        ) || 70;


    const limiteExcelente =
        pontuacaoMaxima
        *
        0.90;


    const limiteMuitoBom =
        pontuacaoMaxima
        *
        0.80;


    const limiteBom =
        notaMinima;


    const limiteAtencao =
        Math.max(
            0,
            notaMinima - 10
        );


    if (
        valor >=
        limiteExcelente
    ) {
        return "EXCELENTE";
    }


    if (
        valor >=
        limiteMuitoBom
    ) {
        return "MUITO BOM";
    }


    if (
        valor >=
        limiteBom
    ) {
        return "BOM";
    }


    if (
        valor >=
        limiteAtencao
    ) {
        return "ATENÇÃO";
    }


    return "CRÍTICO";

}


// =====================================================
// CONTAGEM POR CLASSIFICAÇÃO
// =====================================================

function atualizarClassificacoes(
    avaliacoes
) {

    let excelente = 0;
    let muitoBom = 0;
    let bom = 0;
    let atencao = 0;
    let critico = 0;


    avaliacoes.forEach(
        avaliacao => {

            const classificacao =
                obterClassificacaoDashboard(
                    avaliacao.nota_final
                );


            switch (
                classificacao
            ) {

                case "EXCELENTE":

                    excelente++;

                    break;


                case "MUITO BOM":

                    muitoBom++;

                    break;


                case "BOM":

                    bom++;

                    break;


                case "ATENÇÃO":

                    atencao++;

                    break;


                default:

                    critico++;

                    break;

            }

        }
    );


    definirTextoDashboard(
        "statusExcelente",
        excelente
    );


    definirTextoDashboard(
        "statusMuitoBom",
        muitoBom
    );


    definirTextoDashboard(
        "statusBom",
        bom
    );


    definirTextoDashboard(
        "statusAtencao",
        atencao
    );


    definirTextoDashboard(
        "statusCritico",
        critico
    );

}


// =====================================================
// DESTAQUE DO MÊS
// =====================================================

async function carregarDestaqueDoMes() {

    const elemento =
        document.getElementById(
            "kpiMelhor"
        );


    if (!elemento) {
        return;
    }


    const hoje =
        new Date();


    const ano =
        hoje.getFullYear();


    const mes =
        hoje.getMonth() + 1;


    try {

        const {
            data,
            error
        } =
            await supabaseClient

                .from(
                    "fechamentos_mensais"
                )

                .select(`
                    id,
                    funcionario_id,
                    media_tecnica,
                    classificacao,
                    status
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
                )

                .limit(1);


        if (error) {
            throw error;
        }


        const fechamento =
            data?.[0];


        if (!fechamento) {

            elemento.textContent =
                "Sem fechamento";

            return;

        }


        const {
            data: funcionario,
            error: erroFuncionario
        } =
            await supabaseClient

                .from(
                    "funcionarios"
                )

                .select(`
                    nome,
                    matricula
                `)

                .eq(
                    "id",
                    fechamento.funcionario_id
                )

                .maybeSingle();


        if (erroFuncionario) {
            throw erroFuncionario;
        }


        const nome =
            funcionario?.nome
            ||
            "Funcionário";


        const media =
            Number(
                fechamento.media_tecnica
                || 0
            );


        elemento.textContent =
            `${nome} · ${media.toFixed(1)}`;

    }

    catch (erro) {

        console.error(
            "Erro ao carregar destaque do mês:",
            erro
        );


        elemento.textContent =
            "-";

    }

}


// =====================================================
// TOP COLABORADORES
// =====================================================

function atualizarRankingDashboard(
    avaliacoes
) {

    const container =
        document.getElementById(
            "dashboardRanking"
        );


    if (!container) {
        return;
    }


    if (
        avaliacoes.length === 0
    ) {

        container.innerHTML = `
            <div class="ranking-empty">
                Nenhum dado disponível.
            </div>
        `;

        return;
    }


    const agrupado =
        {};


    avaliacoes.forEach(
        avaliacao => {

            const funcionarioId =
                avaliacao.funcionario_id;


            if (
                !agrupado[
                    funcionarioId
                ]
            ) {

                agrupado[
                    funcionarioId
                ] = {

                    nome:
                        avaliacao
                            .funcionarios
                            ?.nome
                        ||
                        "Funcionário",

                    total:
                        0,

                    quantidade:
                        0

                };

            }


            agrupado[
                funcionarioId
            ].total +=
                Number(
                    avaliacao.nota_final
                    || 0
                );


            agrupado[
                funcionarioId
            ].quantidade++;

        }
    );


    const ranking =
        Object.values(
            agrupado
        )

            .map(
                item => ({

                    nome:
                        item.nome,

                    media:
                        item.quantidade

                            ? item.total
                              /
                              item.quantidade

                            : 0

                })
            )

            .sort(
                (
                    a,
                    b
                ) =>
                    b.media
                    -
                    a.media
            )

            .slice(
                0,
                5
            );


    container.innerHTML =
        ranking

            .map(
                (
                    item,
                    indice
                ) => `
                    <div
                        class="
                            dashboard-ranking-item
                        "
                    >

                        <span
                            class="
                                ranking-position
                            "
                        >
                            ${indice + 1}
                        </span>

                        <div
                            class="
                                ranking-person
                            "
                        >

                            <strong>
                                ${item.nome}
                            </strong>

                            <small>
                                Média de desempenho
                            </small>

                        </div>

                        <strong
                            class="
                                ranking-score
                            "
                        >
                            ${item.media.toFixed(1)}
                        </strong>

                    </div>
                `
            )

            .join("");

}


// =====================================================
// ÚLTIMAS AVALIAÇÕES
// =====================================================

function atualizarUltimasAvaliacoes(
    avaliacoes
) {

    const container =
        document.getElementById(
            "dashboardAvaliacoes"
        );


    if (!container) {
        return;
    }


    if (
        avaliacoes.length === 0
    ) {

        container.innerHTML = `
            <div class="ranking-empty">
                Nenhuma avaliação registrada.
            </div>
        `;

        return;
    }


    const ultimas =
        [...avaliacoes]

            .sort(
                (
                    a,
                    b
                ) => {

                    const dataA =
                        new Date(
                            a.created_at
                            ||
                            a.periodo_fim
                            ||
                            0
                        );


                    const dataB =
                        new Date(
                            b.created_at
                            ||
                            b.periodo_fim
                            ||
                            0
                        );


                    return (
                        dataB
                        -
                        dataA
                    );

                }
            )

            .slice(
                0,
                5
            );


    container.innerHTML =
        ultimas

            .map(
                avaliacao => {

                    const nome =
                        avaliacao
                            .funcionarios
                            ?.nome
                        ||
                        "Funcionário";


                    const nota =
                        Number(
                            avaliacao.nota_final
                            || 0
                        );


                    const data =
                        formatarDataDashboard(
                            avaliacao.created_at
                            ||
                            avaliacao.periodo_fim
                        );


                    return `
                        <div
                            class="
                                dashboard-activity-item
                            "
                        >

                            <div>

                                <strong>
                                    ${nome}
                                </strong>

                                <small>
                                    ${data}
                                </small>

                            </div>

                            <span
                                class="
                                    activity-score
                                "
                            >
                                ${nota}
                            </span>

                        </div>
                    `;

                }
            )

            .join("");

}


// =====================================================
// GRÁFICO DE EVOLUÇÃO
// =====================================================

function atualizarGraficoEvolucao(
    avaliacoes
) {

    const canvas =
        document.getElementById(
            "graficoEvolucao"
        );


    if (!canvas) {

        console.warn(
            "Canvas graficoEvolucao não encontrado."
        );

        return;
    }


    if (
        graficoEvolucaoInstance
    ) {

        graficoEvolucaoInstance
            .destroy();


        graficoEvolucaoInstance =
            null;

    }


    if (
        !avaliacoes
        ||
        avaliacoes.length === 0
    ) {

        return;

    }


    const avaliacoesOrdenadas =
        [...avaliacoes]

            .sort(
                (
                    a,
                    b
                ) => {

                    const dataA =
                        new Date(
                            a.created_at
                            ||
                            a.periodo_fim
                            ||
                            0
                        );


                    const dataB =
                        new Date(
                            b.created_at
                            ||
                            b.periodo_fim
                            ||
                            0
                        );


                    return (
                        dataA
                        -
                        dataB
                    );

                }
            );


    const labels =
        avaliacoesOrdenadas.map(
            avaliacao => {

                const data =
                    avaliacao.created_at
                    ||
                    avaliacao.periodo_fim;


                if (!data) {

                    return (
                        `Semana ${
                            avaliacao.semana
                            ||
                            "-"
                        }`
                    );

                }


                return new Date(
                    data
                ).toLocaleDateString(
                    "pt-BR",
                    {
                        day:
                            "2-digit",

                        month:
                            "2-digit",

                        year:
                            "2-digit"
                    }
                );

            }
        );


    const notas =
        avaliacoesOrdenadas.map(
            avaliacao =>
                Number(
                    avaliacao.nota_final
                    || 0
                )
        );


    const contexto =
        canvas.getContext(
            "2d"
        );


    graficoEvolucaoInstance =
        new Chart(
            contexto,
            {

                type:
                    "line",

                data: {

                    labels:
                        labels,

                    datasets: [

                        {

                            label:
                                "Nota Final",

                            data:
                                notas,

                            borderColor:
                                "#ff7a1a",

                            backgroundColor:
                                "rgba(255, 122, 26, 0.12)",

                            pointBackgroundColor:
                                "#ff7a1a",

                            pointBorderColor:
                                "#ff7a1a",

                            pointRadius:
                                5,

                            pointHoverRadius:
                                7,

                            borderWidth:
                                3,

                            tension:
                                0.35,

                            fill:
                                true

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,


                    interaction: {

                        intersect:
                            false,

                        mode:
                            "index"

                    },


                    plugins: {

                        legend: {
                            display:
                                false
                        },


                        tooltip: {

                            callbacks: {

                                label:
                                    function (
                                        context
                                    ) {

                                        return (
                                            `Nota: ${
                                                context
                                                    .parsed
                                                    .y
                                            }`
                                        );

                                    }

                            }

                        }

                    },


                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            min:
                                0,

                            max:
                                100,

                            ticks: {
                                stepSize:
                                    10
                            },

                            grid: {

                                color:
                                    "rgba(255,255,255,0.06)"

                            }

                        },


                        x: {

                            grid: {
                                display:
                                    false
                            }

                        }

                    }

                }

            }
        );

}


// =====================================================
// UTILITÁRIOS
// =====================================================

function definirTextoDashboard(
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


function formatarDataDashboard(
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