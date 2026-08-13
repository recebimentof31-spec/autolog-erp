let configuracaoRelatorios = {
    pontuacaoMaxima: 100,
    notaMinima: 70
};

async function carregarConfiguracaoRelatorios() {

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

            configuracaoRelatorios = {
                pontuacaoMaxima:
                    Number(data.pontuacao_maxima) || 100,

                notaMinima:
                    Number(data.nota_minima) || 70
            };

        }

        console.log(
            "Configuração dos relatórios carregada:",
            configuracaoRelatorios
        );

    }

    catch (erro) {

        console.error(
            "Erro ao carregar configuração dos relatórios:",
            erro
        );

    }

}

document.addEventListener("DOMContentLoaded", async () => {

    await carregarConfiguracaoRelatorios();
    await carregarRelatorios();

    configurarFiltrosRelatorio();
    configurarImpressao();
    configurarAbasRelatorio();
    configurarParecerGestor();

    await configurarFechamentoMensal();

});

function configurarAbasRelatorio() {

    const botoes =
        document.querySelectorAll(".relatorio-tab");

    const paineis =
        document.querySelectorAll(".relatorio-tab-panel");

    botoes.forEach((botao) => {

        botao.addEventListener("click", () => {

            const alvo =
                botao.dataset.target;

            botoes.forEach((item) => {
                item.classList.remove("active");
            });

            paineis.forEach((painel) => {
                painel.classList.remove("active");
            });

            botao.classList.add("active");

            const painelAlvo =
                document.getElementById(alvo);

            if (painelAlvo) {
                painelAlvo.classList.add("active");
            }

        });

    });

}

let relatorioBase = [];
let graficoRelatorioInstance = null;


// =====================================================
// CARREGA DADOS DO SUPABASE
// =====================================================

async function carregarRelatorios() {

    const { data, error } = await supabaseClient
        .from("avaliacoes_semanais")
        .select(`
            id,
            funcionario_id,
            avaliador_id,
            nota_final,

            produtividade,
            prazo,
            qualidade,
            conhecimento_tecnico,
            proatividade,
            trabalho_equipe,
            adaptabilidade,
            responsabilidade,

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
            "Erro ao carregar relatórios:",
            error
        );

        mostrarErroRelatorio();

        return;
    }

    relatorioBase = data || [];

    carregarFuncionariosFiltro();

    atualizarRelatorio();
}


// =====================================================
// CARREGA FUNCIONÁRIOS NO FILTRO
// =====================================================

function carregarFuncionariosFiltro() {

    const select =
        document.getElementById(
            "relatorioFuncionario"
        );

    if (!select) return;


    const funcionarios = {};


    relatorioBase.forEach(avaliacao => {

        if (!avaliacao.funcionario_id) {
            return;
        }

        if (!funcionarios[avaliacao.funcionario_id]) {

            funcionarios[avaliacao.funcionario_id] = {

                id:
                    avaliacao.funcionario_id,

                nome:
                    avaliacao.funcionarios?.nome
                    || "Funcionário",

                matricula:
                    avaliacao.funcionarios?.matricula
                    || ""

            };
        }
    });


    const lista =
        Object.values(funcionarios)
            .sort((a, b) =>
                a.nome.localeCompare(
                    b.nome,
                    "pt-BR"
                )
            );


    select.innerHTML = `
        <option value="todos">
            Todos os colaboradores
        </option>
    `;


    lista.forEach(funcionario => {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            funcionario.id;

        option.textContent =
            funcionario.matricula
                ? `${funcionario.nome} - ${funcionario.matricula}`
                : funcionario.nome;

        select.appendChild(option);
    });
}


// =====================================================
// CONFIGURA FILTROS
// =====================================================

function configurarFiltrosRelatorio() {

    const funcionario =
        document.getElementById(
            "relatorioFuncionario"
        );

    const periodo =
        document.getElementById(
            "relatorioPeriodo"
        );

    const classificacao =
        document.getElementById(
            "relatorioClassificacao"
        );


    if (funcionario) {

        funcionario.addEventListener(
            "change",
            atualizarRelatorio
        );
    }


    if (periodo) {

        periodo.addEventListener(
            "change",
            atualizarRelatorio
        );
    }


    if (classificacao) {

        classificacao.addEventListener(
            "change",
            atualizarRelatorio
        );
    }
}


// =====================================================
// ATUALIZA RELATÓRIO COMPLETO
// =====================================================

function atualizarRelatorio() {

    const avaliacoes =
        aplicarFiltrosRelatorio(
            relatorioBase
        );

    atualizarKPIsRelatorio(
        avaliacoes
    );

    atualizarGraficoRelatorio(
        avaliacoes
    );

    atualizarTabelaRelatorio(
        avaliacoes
    );

    atualizarQuantidadeResultadosRelatorio(
        avaliacoes
    );

    atualizarResumoIndividual(
        avaliacoes
    );

    atualizarDesempenhoCriterios(
        avaliacoes
    );


}


// =====================================================
// FILTROS
// =====================================================

function aplicarFiltrosRelatorio(avaliacoes) {

    const funcionarioId =
        document.getElementById(
            "relatorioFuncionario"
        )?.value
        || "todos";


    const periodo =
        document.getElementById(
            "relatorioPeriodo"
        )?.value
        || "todos";


    const classificacao =
        document.getElementById(
            "relatorioClassificacao"
        )?.value
        || "todas";


    const agora =
        new Date();


    return avaliacoes.filter(avaliacao => {

        const atendeFuncionario =
            funcionarioId === "todos"
            ||
            avaliacao.funcionario_id ===
            funcionarioId;


        let atendePeriodo = true;


        if (periodo !== "todos") {

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
                obterClassificacaoRelatorio(
                    Number(
                        avaliacao.nota_final
                        || 0
                    )
                );

            atendeClassificacao =
                classe === classificacao;
        }


        return (
            atendeFuncionario
            &&
            atendePeriodo
            &&
            atendeClassificacao
        );
    });
}


// =====================================================
// KPIs
// =====================================================

function atualizarKPIsRelatorio(avaliacoes) {

    const quantidade =
        avaliacoes.length;


    definirTextoRelatorio(
        "relatorioTotalAvaliacoes",
        quantidade
    );


    if (quantidade === 0) {

        definirTextoRelatorio(
            "relatorioMedia",
            "0.0"
        );

        definirTextoRelatorio(
            "relatorioMelhorNota",
            "0"
        );

        definirTextoRelatorio(
            "relatorioMenorNota",
            "0"
        );

        return;
    }


    const notas =
        avaliacoes.map(avaliacao =>
            Number(
                avaliacao.nota_final
                || 0
            )
        );


    const soma =
        notas.reduce(
            (total, nota) =>
                total + nota,
            0
        );


    const media =
        soma / notas.length;


    const melhor =
        Math.max(...notas);


    const menor =
        Math.min(...notas);


    definirTextoRelatorio(
        "relatorioMedia",
        media.toFixed(1)
    );


    definirTextoRelatorio(
        "relatorioMelhorNota",
        melhor
    );


    definirTextoRelatorio(
        "relatorioMenorNota",
        menor
    );
}


// =====================================================
// GRÁFICO
// =====================================================

function atualizarGraficoRelatorio(avaliacoes) {

    const canvas =
        document.getElementById(
            "graficoRelatorio"
        );

    if (!canvas) return;


    if (graficoRelatorioInstance) {

        graficoRelatorioInstance.destroy();

        graficoRelatorioInstance = null;
    }


    const ordenadas =
        [...avaliacoes]
            .sort((a, b) => {

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

                return dataA - dataB;
            });


    const labels =
        ordenadas.map(avaliacao => {

            const semana =
                avaliacao.semana
                || "-";

            const data =
                avaliacao.created_at
                ||
                avaliacao.periodo_fim;


            if (!data) {
                return `Semana ${semana}`;
            }


            const dataFormatada =
                new Date(data)
                    .toLocaleDateString(
                        "pt-BR",
                        {
                            day: "2-digit",
                            month: "2-digit"
                        }
                    );


            return `S${semana} · ${dataFormatada}`;
        });


    const notas =
        ordenadas.map(avaliacao =>
            Number(
                avaliacao.nota_final
                || 0
            )
        );


    const contexto =
        canvas.getContext("2d");


    graficoRelatorioInstance =
        new Chart(
            contexto,
            {

                type: "line",

                data: {

                    labels,

                    datasets: [
                        {
                            label:
                                "Nota da avaliação",

                            data:
                                notas,

                            borderColor:
                                "#ff7518",

                            backgroundColor:
                                "rgba(255,117,24,0.12)",

                            pointBackgroundColor:
                                "#ff7518",

                            pointBorderColor:
                                "#ff7518",

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
                                    function(context) {

                                        return (
                                            `Nota: ${context.parsed.y}`
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
                                    10,

                                color:
                                    "#717b86"
                            },

                            grid: {

                                color:
                                    "rgba(255,255,255,0.06)"
                            }
                        },


                        x: {

                            ticks: {

                                color:
                                    "#717b86"
                            },

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
// TABELA
// =====================================================

function atualizarTabelaRelatorio(avaliacoes) {

    const tbody =
        document.getElementById(
            "relatorioTabelaCorpo"
        );

    if (!tbody) return;


    if (avaliacoes.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="ranking-empty-row"
                >
                    Nenhuma avaliação encontrada.
                </td>
            </tr>
        `;

        return;
    }


    const ordenadas =
        [...avaliacoes]
            .sort((a, b) => {

                return (
                    new Date(
                        b.created_at
                        ||
                        b.periodo_fim
                        ||
                        0
                    )
                    -
                    new Date(
                        a.created_at
                        ||
                        a.periodo_fim
                        ||
                        0
                    )
                );
            });


    tbody.innerHTML =
        ordenadas
            .map(avaliacao => {

                const nome =
                    avaliacao.funcionarios?.nome
                    || "Funcionário";


                const matricula =
                    avaliacao.funcionarios?.matricula
                    || "-";


                const nota =
                    Number(
                        avaliacao.nota_final
                        || 0
                    );


                const classificacao =
                    obterClassificacaoRelatorio(
                        nota
                    );


                const semana =
                    avaliacao.semana
                    || "-";


                return `
                    <tr>

                        <td>
                            ${formatarDataRelatorio(
                                avaliacao.created_at
                                ||
                                avaliacao.periodo_fim
                            )}
                        </td>


                        <td>

                            <div
                                class="ranking-table-person"
                            >

                                <strong>
                                    ${nome}
                                </strong>

                                <small>
                                    Matrícula:
                                    ${matricula}
                                </small>

                            </div>

                        </td>


                        <td>
                            ${semana}
                        </td>


                        <td>

                            <strong
                                class="ranking-table-score"
                            >
                                ${nota}
                            </strong>

                        </td>


                        <td>

                            <span
                                class="
                                    ${classeRelatorio(
                                        classificacao
                                    )}
                                "
                            >
                                ${classificacao}
                            </span>

                        </td>


                        <td>
                            Registrado
                        </td>

                    </tr>
                `;
            })
            .join("");
}


// =====================================================
// QUANTIDADE DE RESULTADOS
// =====================================================

function atualizarQuantidadeResultadosRelatorio(
    avaliacoes
) {

    const elemento =
        document.getElementById(
            "relatorioQuantidadeResultados"
        );

    if (!elemento) return;


    const quantidade =
        avaliacoes.length;


    elemento.textContent =
        quantidade === 1
            ? "1 registro"
            : `${quantidade} registros`;
}


// =====================================================
// CLASSIFICAÇÃO
// =====================================================

function obterClassificacaoRelatorio(nota) {

    const valor =
        Number(nota || 0);

    const pontuacaoMaxima =
        Number(
            configuracaoRelatorios.pontuacaoMaxima
        ) || 100;

    const notaMinima =
        Number(
            configuracaoRelatorios.notaMinima
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
// CLASSE VISUAL
// =====================================================

function classeRelatorio(classificacao) {

    switch (classificacao) {

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
// IMPRESSÃO
// =====================================================

function configurarImpressao() {

    const botao =
        document.getElementById(
            "btnImprimirRelatorio"
        );

    if (!botao) return;


    botao.addEventListener(
        "click",
        () => {

            window.print();
        }
    );
}


// =====================================================
// DATA
// =====================================================

function formatarDataRelatorio(dataISO) {

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
// TEXTO
// =====================================================

function definirTextoRelatorio(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);


    if (elemento) {

        elemento.textContent =
            valor;
    }
}


// =====================================================
// ERRO
// =====================================================

function mostrarErroRelatorio() {

    const tabela =
        document.getElementById(
            "relatorioTabelaCorpo"
        );


    if (tabela) {

        tabela.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="ranking-empty-row"
                >
                    Não foi possível carregar o relatório.
                </td>
            </tr>
        `;
    }
}
// =====================================================
// FECHAMENTO MENSAL
// =====================================================

let fechamentoMensalBase = [];


// =====================================================
// CONFIGURA FECHAMENTO MENSAL
// =====================================================

async function configurarFechamentoMensal() {

    const campoCompetencia =
        document.getElementById(
            "fechamentoCompetencia"
        );

    if (!campoCompetencia) {
        return;
    }


    // Define automaticamente o mês atual
    if (!campoCompetencia.value) {

        const hoje =
            new Date();

        const ano =
            hoje.getFullYear();

        const mes =
            String(
                hoje.getMonth() + 1
            ).padStart(2, "0");

        campoCompetencia.value =
            `${ano}-${mes}`;
    }


    campoCompetencia.addEventListener(
        "change",
        carregarFechamentoMensal
    );


    await carregarFechamentoMensal();
}


// =====================================================
// CARREGA + SINCRONIZA FECHAMENTO MENSAL
// =====================================================

async function carregarFechamentoMensal() {

    const campoCompetencia =
        document.getElementById(
            "fechamentoCompetencia"
        );


    if (!campoCompetencia) {
        return;
    }


    const competencia =
        campoCompetencia.value;


    if (!competencia) {

        fechamentoMensalBase = [];

        atualizarFechamentoMensal();

        return;
    }


    const partes =
        competencia.split("-");


    const ano =
        Number(
            partes[0]
        );


    const mes =
        Number(
            partes[1]
        );


    if (
        !ano
        ||
        !mes
    ) {

        fechamentoMensalBase = [];

        atualizarFechamentoMensal();

        return;
    }


    mostrarCarregandoFechamento();


    try {

        // =================================================
        // INTERVALO DA COMPETÊNCIA
        // =================================================

        const inicioCompetencia =
            `${ano}-${String(
                mes
            ).padStart(2, "0")}-01`;


        let proximoAno =
            ano;


        let proximoMes =
            mes + 1;


        if (proximoMes === 13) {

            proximoMes = 1;

            proximoAno =
                ano + 1;

        }


        const fimCompetencia =
            `${proximoAno}-${String(
                proximoMes
            ).padStart(2, "0")}-01`;


        // =================================================
        // 1. BUSCA AS AVALIAÇÕES ATUAIS DA COMPETÊNCIA
        // =================================================

        const {
            data: avaliacoesCompetencia,
            error: erroAvaliacoes
        } =
            await supabaseClient

                .from(
                    "avaliacoes_semanais"
                )

                .select(`
                    id,
                    funcionario_id,
                    avaliador_id,
                    nota_final,
                    classificacao,
                    semana,
                    competencia,
                    periodo_inicio,
                    periodo_fim,
                    status
                `)

                .eq(
                    "status",
                    "enviada"
                )

                .gte(
                    "competencia",
                    inicioCompetencia
                )

                .lt(
                    "competencia",
                    fimCompetencia
                );


        if (erroAvaliacoes) {
            throw erroAvaliacoes;
        }


        const avaliacoesMes =
            avaliacoesCompetencia
            || [];


        console.log(
            "Avaliações consideradas no fechamento:",
            avaliacoesMes
        );


        // =================================================
        // 2. BUSCA FECHAMENTOS JÁ EXISTENTES
        // =================================================

        const {
            data: fechamentosExistentes,
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
                    nota_final_gestor,
                    nota_gestor,
                    classificacao,
                    parecer_final,
                    parecer_atualizado_em,
                    fechado_por,
                    fechado_em,
                    status,
                    created_at,
                    updated_at
                `)

                .eq(
                    "ano",
                    ano
                )

                .eq(
                    "mes",
                    mes
                );


        if (erroFechamentos) {
            throw erroFechamentos;
        }


        const fechamentosAtuais =
            fechamentosExistentes
            || [];


        // =================================================
        // 3. AGRUPA AS AVALIAÇÕES POR FUNCIONÁRIO
        // =================================================

        const avaliacoesPorFuncionario =
            {};


        avaliacoesMes.forEach(
            avaliacao => {

                const funcionarioId =
                    avaliacao.funcionario_id;


                if (!funcionarioId) {
                    return;
                }


                if (
                    !avaliacoesPorFuncionario[
                        funcionarioId
                    ]
                ) {

                    avaliacoesPorFuncionario[
                        funcionarioId
                    ] = [];

                }


                avaliacoesPorFuncionario[
                    funcionarioId
                ].push(
                    avaliacao
                );

            }
        );


        // =================================================
        // 4. SINCRONIZA CADA COLABORADOR
        // =================================================

        for (
            const funcionarioId
            of Object.keys(
                avaliacoesPorFuncionario
            )
        ) {

            const listaAvaliacoes =
                avaliacoesPorFuncionario[
                    funcionarioId
                ];


            if (
                !listaAvaliacoes
                ||
                listaAvaliacoes.length === 0
            ) {

                continue;
            }


            // =============================================
            // CALCULA MÉDIA ATUAL
            // =============================================

            const somaNotas =
                listaAvaliacoes.reduce(
                    (
                        total,
                        avaliacao
                    ) => {

                        return (
                            total
                            +
                            Number(
                                avaliacao.nota_final
                                || 0
                            )
                        );

                    },
                    0
                );


            const mediaTecnica =
                somaNotas
                /
                listaAvaliacoes.length;


            const mediaArredondada =
                Number(
                    mediaTecnica.toFixed(1)
                );


            const classificacaoAtual =
                obterClassificacaoRelatorio(
                    mediaArredondada
                );


            // =============================================
            // PROCURA FECHAMENTO EXISTENTE
            // =============================================

            const fechamentoExistente =
                fechamentosAtuais.find(
                    item => {

                        return (
                            String(
                                item.funcionario_id
                            )
                            ===
                            String(
                                funcionarioId
                            )
                        );

                    }
                );


            // =============================================
            // FECHADO = HISTÓRICO PROTEGIDO
            // NÃO RECALCULA
            // =============================================

            if (
                fechamentoExistente
                &&
                String(
                    fechamentoExistente.status
                    || ""
                ).toLowerCase()
                === "fechado"
            ) {

                console.log(
                    "Fechamento protegido:",
                    {
                        funcionarioId,
                        media:
                            fechamentoExistente
                                .media_tecnica
                    }
                );


                continue;
            }


            // =============================================
            // ATUALIZA FECHAMENTO ABERTO
            // =============================================

            if (fechamentoExistente) {

                const {
                    error: erroAtualizacao
                } =
                    await supabaseClient

                        .from(
                            "fechamentos_mensais"
                        )

                        .update({

                            media_tecnica:
                                mediaArredondada,

                            classificacao:
                                classificacaoAtual,

                            updated_at:
                                new Date()
                                    .toISOString()

                        })

                        .eq(
                            "id",
                            fechamentoExistente.id
                        );


                if (erroAtualizacao) {
                    throw erroAtualizacao;
                }


                console.log(
                    "Fechamento aberto recalculado:",
                    {
                        funcionarioId,
                        media:
                            mediaArredondada,
                        classificacao:
                            classificacaoAtual,
                        avaliacoes:
                            listaAvaliacoes.length
                    }
                );

            }


            // =============================================
            // CRIA FECHAMENTO ABERTO
            // =============================================

            else {

                const {
                    error: erroCriacao
                } =
                    await supabaseClient

                        .from(
                            "fechamentos_mensais"
                        )

                        .insert([{

                            funcionario_id:
                                funcionarioId,

                            ano:
                                ano,

                            mes:
                                mes,

                            media_tecnica:
                                mediaArredondada,

                            classificacao:
                                classificacaoAtual,

                            status:
                                "aberto"

                        }]);


                if (erroCriacao) {
                    throw erroCriacao;
                }


                console.log(
                    "Novo fechamento mensal criado:",
                    {
                        funcionarioId,
                        media:
                            mediaArredondada,
                        classificacao:
                            classificacaoAtual,
                        avaliacoes:
                            listaAvaliacoes.length
                    }
                );

            }

        }


        // =================================================
        // 5. RECARREGA FECHAMENTOS DEPOIS DA SINCRONIZAÇÃO
        // =================================================

        const {
            data: fechamentosSincronizados,
            error: erroSincronizados
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
                    nota_final_gestor,
                    nota_gestor,
                    classificacao,
                    parecer_final,
                    parecer_atualizado_em,
                    fechado_por,
                    fechado_em,
                    status,
                    created_at,
                    updated_at
                `)

                .eq(
                    "ano",
                    ano
                )

                .eq(
                    "mes",
                    mes
                )

                .order(
                    "media_tecnica",
                    {
                        ascending: false
                    }
                );


        if (erroSincronizados) {
            throw erroSincronizados;
        }


        const lista =
            fechamentosSincronizados
            || [];


        // =================================================
        // 6. BUSCA DADOS DOS FUNCIONÁRIOS
        // =================================================

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
                        matricula
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


        // =================================================
        // 7. JUNTA FECHAMENTO + FUNCIONÁRIO
        // =================================================

        fechamentoMensalBase =
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


        console.log(
            "Fechamento mensal sincronizado:",
            fechamentoMensalBase
        );


        // =================================================
        // 8. ATUALIZA A TELA
        // =================================================

        atualizarFechamentoMensal();

    }


    catch (erro) {

        console.error(
            "Erro ao carregar/sincronizar fechamento mensal:",
            erro
        );


        fechamentoMensalBase =
            [];


        mostrarErroFechamento();

    }

}

// =====================================================
// ATUALIZA PAINEL COMPLETO
// =====================================================

function atualizarFechamentoMensal() {

    atualizarKPIsFechamento();

    atualizarTabelaFechamento();

    atualizarQuantidadeFechamento();

}


// =====================================================
// KPIs DO FECHAMENTO
// =====================================================

function atualizarKPIsFechamento() {

    const quantidade =
        fechamentoMensalBase.length;


    definirTextoRelatorio(
        "fechamentoKpiColaboradores",
        quantidade
    );


    if (quantidade === 0) {

        definirTextoRelatorio(
            "fechamentoKpiMedia",
            "0.0"
        );

        definirTextoRelatorio(
            "fechamentoKpiMelhor",
            "0.0"
        );

        definirTextoRelatorio(
            "fechamentoKpiFechados",
            "0"
        );

        return;
    }


    const medias =
        fechamentoMensalBase
            .map(item =>
                Number(
                    item.media_tecnica
                    || 0
                )
            );


    const soma =
        medias.reduce(
            (total, valor) =>
                total + valor,
            0
        );


    const mediaGeral =
        soma / medias.length;


    const melhorMedia =
        Math.max(
            ...medias
        );


    const fechados =
        fechamentoMensalBase
            .filter(item =>
                String(
                    item.status || ""
                ).toLowerCase()
                === "fechado"
            )
            .length;


    definirTextoRelatorio(
        "fechamentoKpiMedia",
        mediaGeral.toFixed(1)
    );


    definirTextoRelatorio(
        "fechamentoKpiMelhor",
        melhorMedia.toFixed(1)
    );


    definirTextoRelatorio(
        "fechamentoKpiFechados",
        fechados
    );

}


// =====================================================
// TABELA DO FECHAMENTO
// =====================================================

function atualizarTabelaFechamento() {

    const tbody =
        document.getElementById(
            "fechamentoTabelaCorpo"
        );

    if (!tbody) {
        return;
    }


    if (
        fechamentoMensalBase.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="fechamento-empty-row"
                >
                    Nenhum fechamento encontrado
                    para esta competência.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        fechamentoMensalBase
            .map(item => {

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
                    obterClassificacaoRelatorio(
                        media
                    );


                const status =
                    String(
                        item.status
                        || "aberto"
                    ).toUpperCase();


                const periodo =
                    formatarCompetenciaFechamento(
                        item.ano,
                        item.mes
                    );


                const competenciaMes =
                    `${item.ano}-${String(
                        item.mes
                    ).padStart(2, "0")}`;


                const quantidadeSemanas =
                    relatorioBase.filter(
                        avaliacao => {

                            const mesmoFuncionario =
                                String(
                                    avaliacao.funcionario_id
                                )
                                ===
                                String(
                                    item.funcionario_id
                                );


                            const competenciaAvaliacao =
                                String(
                                    avaliacao.competencia
                                    || ""
                                ).slice(0, 7);


                            return (
                                mesmoFuncionario
                                &&
                                competenciaAvaliacao
                                    === competenciaMes
                            );
                        }
                    ).length;


                return `
                    <tr>

                        <td>

                            <div
                                class="ranking-table-person"
                            >

                                <strong>
                                    ${nome}
                                </strong>

                                <small>
                                    Matrícula:
                                    ${matricula}
                                </small>

                            </div>

                        </td>


                        <td>
                            ${periodo}
                        </td>


                        <td>
                            <strong>
                                ${quantidadeSemanas}
                            </strong>
                        </td>


                        <td>

                            <strong
                                class="ranking-table-score"
                            >
                                ${media.toFixed(1)}
                            </strong>

                        </td>


                        <td>

                            <span
                                class="
                                    ${classeRelatorio(
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


                        <td>
                            ${
                                String(
                                    item.status
                                    || "aberto"
                                ).toLowerCase()
                                === "fechado"

                                    ? `
                                        <button
                                            type="button"
                                            class="fechamento-btn-detalhes"
                                            onclick="abrirDetalhesFechamento('${item.id}')"
                                        >
                                            Ver detalhes
                                        </button>
                                    `

                                    : `
                                        <button
                                            type="button"
                                            class="fechamento-btn-finalizar"
                                            onclick="fecharMesColaborador('${item.id}')"
                                        >
                                            Fechar mês
                                        </button>
                                    `
                            }
                        </td>

                    </tr>
                `;
            })
            .join("");

}

// =====================================================
// QUANTIDADE DE FECHAMENTOS
// =====================================================

function atualizarQuantidadeFechamento() {

    const elemento =
        document.getElementById(
            "fechamentoTotalRegistros"
        );

    if (!elemento) {
        return;
    }


    const quantidade =
        fechamentoMensalBase.length;


    elemento.textContent =
        quantidade === 1
            ? "1 registro"
            : `${quantidade} registros`;

}


// =====================================================
// FORMATA COMPETÊNCIA
// =====================================================

function formatarCompetenciaFechamento(
    ano,
    mes
) {

    if (!ano || !mes) {
        return "-";
    }


    const data =
        new Date(
            Number(ano),
            Number(mes) - 1,
            1
        );


    const texto =
        data.toLocaleDateString(
            "pt-BR",
            {
                month: "long",
                year: "numeric"
            }
        );


    return (
        texto.charAt(0).toUpperCase()
        +
        texto.slice(1)
    );

}


// =====================================================
// CARREGANDO
// =====================================================

function mostrarCarregandoFechamento() {

    const tbody =
        document.getElementById(
            "fechamentoTabelaCorpo"
        );


    if (tbody) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="7"
                    class="fechamento-empty-row"
                >
                    Carregando fechamento mensal...
                </td>

            </tr>
        `;
    }

}


// =====================================================
// ERRO
// =====================================================

function mostrarErroFechamento() {

    definirTextoRelatorio(
        "fechamentoKpiColaboradores",
        "0"
    );

    definirTextoRelatorio(
        "fechamentoKpiMedia",
        "0.0"
    );

    definirTextoRelatorio(
        "fechamentoKpiMelhor",
        "0.0"
    );

    definirTextoRelatorio(
        "fechamentoKpiFechados",
        "0"
    );


    const tbody =
        document.getElementById(
            "fechamentoTabelaCorpo"
        );


    if (tbody) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="7"
                    class="fechamento-empty-row"
                >
                    Não foi possível carregar
                    o fechamento mensal.
                </td>

            </tr>
        `;
    }

}
// =====================================================
// FINALIZA FECHAMENTO MENSAL
// =====================================================

async function fecharMesColaborador(fechamentoId) {

    if (!fechamentoId) {
        return;
    }

    const fechamento =
        fechamentoMensalBase.find(
            item => item.id === fechamentoId
        );

    if (!fechamento) {

        alert(
            "Fechamento não encontrado."
        );

        return;
    }


    const statusAtual =
        String(
            fechamento.status || ""
        ).toLowerCase();


    if (statusAtual === "fechado") {
        return;
    }


    const nome =
        fechamento.funcionario?.nome
        || "este colaborador";


    const periodo =
        formatarCompetenciaFechamento(
            fechamento.ano,
            fechamento.mes
        );


    const confirmar =
        window.confirm(
            `Deseja finalizar o fechamento mensal de ${nome} referente a ${periodo}?`
        );


    if (!confirmar) {
        return;
    }


    try {

        const {
            data: sessaoData,
            error: erroSessao
        } =
            await supabaseClient.auth.getSession();


        if (erroSessao) {
            throw erroSessao;
        }


       const authUserId =
    sessaoData?.session?.user?.id
    || null;


let perfilUsuarioId = null;


if (authUserId) {

    const {
        data: perfilUsuario,
        error: erroPerfil
    } = await supabaseClient

        .from("perfis_usuario")

        .select("id")

        .eq(
            "auth_user_id",
            authUserId
        )

        .maybeSingle();


    if (erroPerfil) {
        throw erroPerfil;
    }


    perfilUsuarioId =
        perfilUsuario?.id
        || null;
}


const atualizacao = {

    status:
        "fechado",

    fechado_em:
        new Date().toISOString()

};


if (perfilUsuarioId) {

    atualizacao.fechado_por =
        perfilUsuarioId;
}

        const {
            data,
            error
        } =
            await supabaseClient

                .from(
                    "fechamentos_mensais"
                )

                .update(
                    atualizacao
                )

                .eq(
                    "id",
                    fechamentoId
                )

                .select(`
                    id,
                    status,
                    fechado_em,
                    fechado_por
                `)

                .single();


        if (error) {
            throw error;
        }


        console.log(
            "Fechamento mensal finalizado:",
            data
        );


        await carregarFechamentoMensal();

    }

    catch (erro) {

        console.error(
            "Erro ao finalizar fechamento mensal:",
            erro
        );


        alert(
            "Não foi possível finalizar o fechamento mensal."
        );

    }

}

// =====================================================
// DETALHES DO FECHAMENTO MENSAL
// =====================================================

let fechamentoDetalhesAtualId = null;


// =====================================================
// ABRE DETALHES DO FECHAMENTO
// =====================================================

async function abrirDetalhesFechamento(fechamentoId) {

    fechamentoDetalhesAtualId =
        fechamentoId;


    const fechamento =
        fechamentoMensalBase.find(
            item =>
                String(item.id) ===
                String(fechamentoId)
        );


    if (!fechamento) {

        alert(
            "Não foi possível localizar este fechamento."
        );

        return;
    }


    const modal =
        document.getElementById(
            "modalDetalhesFechamento"
        );


    const resumo =
        document.getElementById(
            "fechamentoDetalhesResumo"
        );


    const tbody =
        document.getElementById(
            "detalhesAvaliacoesCorpo"
        );


    const contador =
        document.getElementById(
            "detalhesTotalAvaliacoes"
        );


    if (
        !modal
        ||
        !resumo
        ||
        !tbody
    ) {

        console.error(
            "Estrutura do modal de detalhes não encontrada."
        );

        return;
    }


    // =============================================
    // ABRE MODAL
    // =============================================

    modal.classList.add(
        "active"
    );


    // =============================================
    // ESTADO DE CARREGAMENTO
    // =============================================

    resumo.innerHTML = `

        <div class="detalhe-resumo-card">

            <small>
                Colaborador
            </small>

            <strong>
                Carregando...
            </strong>

        </div>

    `;


    tbody.innerHTML = `

        <tr>

            <td colspan="4">
                Carregando avaliações...
            </td>

        </tr>

    `;


    if (contador) {

        contador.textContent =
            "Carregando...";

    }


    limparCriteriosDetalhes();


    try {

        // =============================================
        // DADOS DO FECHAMENTO
        // =============================================

        const funcionarioId =
            fechamento.funcionario_id;


        const ano =
            Number(
                fechamento.ano
            );


        const mes =
            Number(
                fechamento.mes
            );


        // =============================================
        // INTERVALO DA COMPETÊNCIA
        // =============================================

        const inicioCompetencia =
            `${ano}-${String(
                mes
            ).padStart(
                2,
                "0"
            )}-01`;


        let proximoAno =
            ano;


        let proximoMes =
            mes + 1;


        if (proximoMes === 13) {

            proximoMes = 1;

            proximoAno =
                ano + 1;

        }


        const fimCompetencia =
            `${proximoAno}-${String(
                proximoMes
            ).padStart(
                2,
                "0"
            )}-01`;


        // =============================================
        // BUSCA AS AVALIAÇÕES DO MÊS
        // AGORA COM OS 8 CRITÉRIOS
        // =============================================

        const {
            data: avaliacoes,
            error: erroAvaliacoes
        } =
            await supabaseClient

                .from(
                    "avaliacoes_semanais"
                )

                .select(`
                    id,
                    semana,
                    nota_final,
                    classificacao,
                    status,
                    competencia,
                    periodo_inicio,
                    periodo_fim,
                    created_at,

                    produtividade,
                    prazo,
                    qualidade,
                    conhecimento_tecnico,
                    proatividade,
                    trabalho_equipe,
                    adaptabilidade,
                    responsabilidade
                `)

                .eq(
                    "funcionario_id",
                    funcionarioId
                )

                .eq(
                    "status",
                    "enviada"
                )

                .gte(
                    "competencia",
                    inicioCompetencia
                )

                .lt(
                    "competencia",
                    fimCompetencia
                )

                .order(
                    "semana",
                    {
                        ascending: true
                    }
                );


        if (erroAvaliacoes) {

            throw erroAvaliacoes;

        }


        const listaAvaliacoes =
            avaliacoes || [];


        // =============================================
        // QUEM FECHOU
        // =============================================

        let responsavelFechamento =
            "Não informado";


        if (fechamento.fechado_por) {

            const {
                data: perfil,
                error: erroPerfil
            } =
                await supabaseClient

                    .from(
                        "perfis_usuario"
                    )

                    .select(`
                        id,
                        nome_exibicao
                    `)

                    .eq(
                        "id",
                        fechamento.fechado_por
                    )

                    .maybeSingle();


            if (
                !erroPerfil
                &&
                perfil
            ) {

                responsavelFechamento =
                    perfil.nome_exibicao
                    ||
                    "Usuário do sistema";

            }

            else {

                responsavelFechamento =
                    "Usuário do sistema";


                if (erroPerfil) {

                    console.warn(
                        "Não foi possível identificar o responsável:",
                        erroPerfil
                    );

                }

            }

        }


        // =============================================
        // DADOS PRINCIPAIS
        // =============================================

        const nome =
            fechamento.funcionario?.nome
            ||
            "Funcionário";


        const matricula =
            fechamento.funcionario?.matricula
            ||
            "-";


        const media =
            Number(
                fechamento.media_tecnica
                || 0
            );


        const classificacao =
            fechamento.classificacao
            ||
            obterClassificacaoRelatorio(
                media
            );


        const status =
            String(
                fechamento.status
                || "aberto"
            ).toUpperCase();


        const periodo =
            formatarCompetenciaFechamento(
                fechamento.ano,
                fechamento.mes
            );


        const fechadoEm =
            fechamento.fechado_em

                ? formatarDataHoraFechamento(
                    fechamento.fechado_em
                )

                : "-";


        // =============================================
        // PREENCHE NOTA DO GESTOR / PARECER
        // =============================================

        const campoNotaGestor =
            document.getElementById(
                "detalhesNotaGestor"
            );


        const campoParecer =
            document.getElementById(
                "detalhesParecerFinal"
            );


        const contadorParecer =
            document.getElementById(
                "contadorParecer"
            );


        const statusParecer =
            document.getElementById(
                "parecerStatusSalvo"
            );


        if (campoNotaGestor) {

            campoNotaGestor.value =
                fechamento.nota_gestor
                ?? "";

        }


        if (campoParecer) {

            campoParecer.value =
                fechamento.parecer_final
                || "";

        }


        if (contadorParecer) {

            contadorParecer.textContent =
                String(
                    fechamento.parecer_final
                    || ""
                ).length;

        }


        if (statusParecer) {

            statusParecer.textContent =
                fechamento.parecer_atualizado_em

                    ? `Última atualização: ${
                        formatarDataHoraFechamento(
                            fechamento.parecer_atualizado_em
                        )
                    }`

                    : "";

        }


        // =============================================
        // RESUMO DO FECHAMENTO
        // =============================================

        resumo.innerHTML = `

            <div class="detalhe-resumo-card">

                <small>
                    Colaborador
                </small>

                <strong>
                    ${escaparHTMLDetalhes(
                        nome
                    )}
                </strong>

            </div>


            <div class="detalhe-resumo-card">

                <small>
                    Matrícula
                </small>

                <strong>
                    ${escaparHTMLDetalhes(
                        matricula
                    )}
                </strong>

            </div>


            <div class="detalhe-resumo-card">

                <small>
                    Competência
                </small>

                <strong>
                    ${escaparHTMLDetalhes(
                        periodo
                    )}
                </strong>

            </div>


            <div class="detalhe-resumo-card">

                <small>
                    Média mensal
                </small>

                <strong class="detalhe-destaque">
                    ${media.toFixed(1)}
                </strong>

            </div>


            <div class="detalhe-resumo-card">

                <small>
                    Classificação
                </small>

                <strong>
                    ${escaparHTMLDetalhes(
                        classificacao
                    )}
                </strong>

            </div>


            <div class="detalhe-resumo-card">

                <small>
                    Status
                </small>

                <strong>
                    ${escaparHTMLDetalhes(
                        status
                    )}
                </strong>

            </div>


            <div class="detalhe-resumo-card">

                <small>
                    Fechado por
                </small>

                <strong>
                    ${escaparHTMLDetalhes(
                        responsavelFechamento
                    )}
                </strong>

            </div>


            <div class="detalhe-resumo-card">

                <small>
                    Fechado em
                </small>

                <strong>
                    ${escaparHTMLDetalhes(
                        fechadoEm
                    )}
                </strong>

            </div>

        `;


        // =============================================
        // CONTADOR DE AVALIAÇÕES
        // =============================================

        if (contador) {

            const quantidade =
                listaAvaliacoes.length;


            contador.textContent =
                quantidade === 1

                    ? "1 avaliação"

                    : `${quantidade} avaliações`;

        }


        // =============================================
        // CRITÉRIOS
        // =============================================

        atualizarCriteriosDetalhes(
            listaAvaliacoes
        );


        // =============================================
        // SEM AVALIAÇÕES
        // =============================================

        if (
            listaAvaliacoes.length === 0
        ) {

            tbody.innerHTML = `

                <tr>

                    <td colspan="4">

                        Nenhuma avaliação encontrada
                        para esta competência.

                    </td>

                </tr>

            `;


            return;

        }


        // =============================================
        // TABELA SEMANAL
        // =============================================

        tbody.innerHTML =
            listaAvaliacoes

                .map(
                    avaliacao => {

                        const nota =
                            Number(
                                avaliacao.nota_final
                                || 0
                            );


                        const classe =
                            avaliacao.classificacao
                            ||
                            obterClassificacaoRelatorio(
                                nota
                            );


                        const data =
                            avaliacao.created_at
                            ||
                            avaliacao.periodo_fim
                            ||
                            avaliacao.competencia;


                        return `

                            <tr>

                                <td>

                                    Semana
                                    ${
                                        avaliacao.semana
                                        || "-"
                                    }

                                </td>


                                <td>

                                    <strong
                                        class="ranking-table-score"
                                    >
                                        ${nota.toFixed(1)}
                                    </strong>

                                </td>


                                <td>

                                    <span
                                        class="
                                            ${classeRelatorio(
                                                classe
                                            )}
                                        "
                                    >

                                        ${escaparHTMLDetalhes(
                                            classe
                                        )}

                                    </span>

                                </td>


                                <td>

                                    ${formatarDataRelatorio(
                                        data
                                    )}

                                </td>

                            </tr>

                        `;

                    }
                )

                .join("");


        console.log(
            "Relatório individual carregado:",
            {
                fechamento,
                avaliacoes:
                    listaAvaliacoes
            }
        );

    }


    catch (erro) {

        console.error(
            "Erro ao carregar detalhes do fechamento:",
            erro
        );


        resumo.innerHTML = `

            <div class="detalhe-resumo-card">

                <small>
                    Erro
                </small>

                <strong>
                    Não foi possível carregar os detalhes.
                </strong>

            </div>

        `;


        tbody.innerHTML = `

            <tr>

                <td colspan="4">

                    Não foi possível carregar
                    as avaliações.

                </td>

            </tr>

        `;


        if (contador) {

            contador.textContent =
                "0 avaliações";

        }


        limparCriteriosDetalhes();

    }

}


// =====================================================
// CRITÉRIOS DO RELATÓRIO INDIVIDUAL
// =====================================================

function atualizarCriteriosDetalhes(
    avaliacoes
) {

    const criterios = [

        {
            campo:
                "produtividade",

            nome:
                "Produtividade",

            elemento:
                "detalhesCriterioProdutividade",

            maximo:
                15
        },


        {
            campo:
                "prazo",

            nome:
                "Prazo",

            elemento:
                "detalhesCriterioPrazo",

            maximo:
                10
        },


        {
            campo:
                "qualidade",

            nome:
                "Qualidade",

            elemento:
                "detalhesCriterioQualidade",

            maximo:
                15
        },


        {
            campo:
                "conhecimento_tecnico",

            nome:
                "Conhecimento técnico",

            elemento:
                "detalhesCriterioConhecimento",

            maximo:
                15
        },


        {
            campo:
                "proatividade",

            nome:
                "Proatividade",

            elemento:
                "detalhesCriterioProatividade",

            maximo:
                10
        },


        {
            campo:
                "trabalho_equipe",

            nome:
                "Trabalho em equipe",

            elemento:
                "detalhesCriterioTrabalhoEquipe",

            maximo:
                15
        },


        {
            campo:
                "adaptabilidade",

            nome:
                "Adaptabilidade",

            elemento:
                "detalhesCriterioAdaptabilidade",

            maximo:
                10
        },


        {
            campo:
                "responsabilidade",

            nome:
                "Responsabilidade",

            elemento:
                "detalhesCriterioResponsabilidade",

            maximo:
                10
        }

    ];


    if (
        !Array.isArray(
            avaliacoes
        )
        ||
        avaliacoes.length === 0
    ) {

        limparCriteriosDetalhes();

        return;

    }


    const resultados =
        criterios.map(
            criterio => {

                const valores =
                    avaliacoes

                        .map(
                            avaliacao =>
                                Number(
                                    avaliacao[
                                        criterio.campo
                                    ]
                                )
                        )

                        .filter(
                            valor =>
                                Number.isFinite(
                                    valor
                                )
                        );


                const mediaPontos =
                    valores.length > 0

                        ? valores.reduce(
                            (
                                total,
                                valor
                            ) =>
                                total
                                +
                                valor,
                            0
                        )
                        /
                        valores.length

                        : 0;


                const percentual =
                    criterio.maximo > 0

                        ? (
                            mediaPontos
                            /
                            criterio.maximo
                        )
                        *
                        100

                        : 0;


                const percentualLimitado =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            percentual
                        )
                    );


                const elemento =
                    document.getElementById(
                        criterio.elemento
                    );


                if (elemento) {

                    elemento.textContent =
                        `${percentualLimitado.toFixed(1)}%`;

                }


                return {

                    nome:
                        criterio.nome,

                    percentual:
                        percentualLimitado

                };

            }
        );


    // =============================================
    // PONTO FORTE
    // =============================================

    const ordenados =
        [...resultados].sort(
            (
                a,
                b
            ) =>
                b.percentual
                -
                a.percentual
        );


    const pontoForte =
        ordenados[0];


    const pontoAtencao =
        ordenados[
            ordenados.length - 1
        ];


    definirTextoRelatorio(
        "detalhesPontoForte",
        pontoForte?.nome
        || "-"
    );


    definirTextoRelatorio(
        "detalhesPontoForteNota",
        pontoForte

            ? `${pontoForte.percentual.toFixed(1)}%`

            : "0.0%"
    );


    // =============================================
    // PONTO DE ATENÇÃO
    // =============================================

    definirTextoRelatorio(
        "detalhesPontoAtencao",
        pontoAtencao?.nome
        || "-"
    );


    definirTextoRelatorio(
        "detalhesPontoAtencaoNota",
        pontoAtencao

            ? `${pontoAtencao.percentual.toFixed(1)}%`

            : "0.0%"
    );

}


// =====================================================
// LIMPA CRITÉRIOS
// =====================================================

function limparCriteriosDetalhes() {

    const ids = [

        "detalhesCriterioProdutividade",

        "detalhesCriterioPrazo",

        "detalhesCriterioQualidade",

        "detalhesCriterioConhecimento",

        "detalhesCriterioProatividade",

        "detalhesCriterioTrabalhoEquipe",

        "detalhesCriterioAdaptabilidade",

        "detalhesCriterioResponsabilidade"

    ];


    ids.forEach(
        id => {

            definirTextoRelatorio(
                id,
                "0.0%"
            );

        }
    );


    definirTextoRelatorio(
        "detalhesPontoForte",
        "-"
    );


    definirTextoRelatorio(
        "detalhesPontoForteNota",
        "0.0%"
    );


    definirTextoRelatorio(
        "detalhesPontoAtencao",
        "-"
    );


    definirTextoRelatorio(
        "detalhesPontoAtencaoNota",
        "0.0%"
    );

}


// =====================================================
// FECHA MODAL DE DETALHES
// =====================================================

function fecharModalDetalhes() {

    const modal =
        document.getElementById(
            "modalDetalhesFechamento"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


// =====================================================
// FORMATA DATA E HORA
// =====================================================

function formatarDataHoraFechamento(
    dataISO
) {

    if (!dataISO) {

        return "-";

    }


    const data =
        new Date(
            dataISO
        );


    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return "-";

    }


    return data.toLocaleString(
        "pt-BR",
        {

            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"

        }
    );

}


// =====================================================
// PROTEÇÃO DE HTML
// =====================================================

function escaparHTMLDetalhes(
    valor
) {

    return String(
        valor ?? ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// =====================================================
// CONFIGURA PARECER + IMPRESSÃO
// =====================================================

function configurarParecerGestor() {

    const botao =
        document.getElementById(
            "btnSalvarParecer"
        );


    const campoParecer =
        document.getElementById(
            "detalhesParecerFinal"
        );


    const contador =
        document.getElementById(
            "contadorParecer"
        );


    const botaoImprimir =
        document.getElementById(
            "btnImprimirFechamento"
        );


    // =============================================
    // CONTADOR DO PARECER
    // =============================================

    if (
        campoParecer
        &&
        contador
    ) {

        campoParecer.addEventListener(
            "input",
            () => {

                contador.textContent =
                    campoParecer.value.length;

            }
        );

    }


    // =============================================
    // SALVAR PARECER
    // =============================================

    if (botao) {

        botao.addEventListener(
            "click",
            salvarParecerGestor
        );

    }


    // =============================================
    // IMPRIMIR
    // =============================================

    if (botaoImprimir) {

        botaoImprimir.addEventListener(
            "click",
            imprimirFechamentoIndividual
        );

    }

}


// =====================================================
// SALVA PARECER FINAL DO GESTOR
// =====================================================

async function salvarParecerGestor() {

    if (!fechamentoDetalhesAtualId) {

        alert(
            "Nenhum fechamento selecionado."
        );

        return;

    }


    const campoNota =
        document.getElementById(
            "detalhesNotaGestor"
        );


    const campoParecer =
        document.getElementById(
            "detalhesParecerFinal"
        );


    const botao =
        document.getElementById(
            "btnSalvarParecer"
        );


    const status =
        document.getElementById(
            "parecerStatusSalvo"
        );


    const parecer =
        campoParecer?.value.trim()
        || "";


    let notaGestor =
        null;


    // =============================================
    // VALIDA NOTA
    // =============================================

    if (
        campoNota
        &&
        campoNota.value !== ""
    ) {

        notaGestor =
            Number(
                campoNota.value
            );


        if (
            Number.isNaN(
                notaGestor
            )
            ||
            notaGestor < 0
            ||
            notaGestor > 100
        ) {

            alert(
                "A nota do gestor deve estar entre 0 e 100."
            );

            return;

        }

    }


    // =============================================
    // VALIDA PARECER
    // =============================================

    if (
        parecer.length > 2000
    ) {

        alert(
            "O parecer deve ter no máximo 2000 caracteres."
        );

        return;

    }


    // =============================================
    // BOTÃO
    // =============================================

    if (botao) {

        botao.disabled =
            true;


        botao.textContent =
            "Salvando...";

    }


    if (status) {

        status.textContent =
            "Salvando parecer...";

    }


    try {

        const agora =
            new Date()
                .toISOString();


        const {
            data,
            error
        } =
            await supabaseClient

                .from(
                    "fechamentos_mensais"
                )

                .update({

                    nota_gestor:
                        notaGestor,

                    parecer_final:
                        parecer
                        || null,

                    parecer_atualizado_em:
                        agora

                })

                .eq(
                    "id",
                    fechamentoDetalhesAtualId
                )

                .select(`
                    id,
                    nota_gestor,
                    parecer_final,
                    parecer_atualizado_em
                `)

                .single();


        if (error) {

            throw error;

        }


        // =============================================
        // ATUALIZA CACHE LOCAL
        // =============================================

        const fechamento =
            fechamentoMensalBase.find(
                item =>
                    String(item.id)
                    ===
                    String(
                        fechamentoDetalhesAtualId
                    )
            );


        if (fechamento) {

            fechamento.nota_gestor =
                data.nota_gestor;


            fechamento.parecer_final =
                data.parecer_final;


            fechamento.parecer_atualizado_em =
                data.parecer_atualizado_em;

        }


        if (status) {

            status.textContent =
                `Parecer salvo em ${
                    formatarDataHoraFechamento(
                        data.parecer_atualizado_em
                    )
                }`;

        }


        console.log(
            "Parecer final salvo:",
            data
        );

    }


    catch (erro) {

        console.error(
            "Erro ao salvar parecer final:",
            erro
        );


        if (status) {

            status.textContent =
                "Erro ao salvar parecer.";

        }


        alert(
            "Não foi possível salvar o parecer final."
        );

    }


    finally {

        if (botao) {

            botao.disabled =
                false;


            botao.textContent =
                "Salvar parecer";

        }

    }

}


// =====================================================
// IMPRIME SOMENTE O RELATÓRIO INDIVIDUAL
// =====================================================

function imprimirFechamentoIndividual() {

    const modal =
        document.getElementById(
            "modalDetalhesFechamento"
        );


    if (!modal) {

        return;

    }


    // =============================================
    // CRIA CSS TEMPORÁRIO DE IMPRESSÃO
    // =============================================

    const style =
        document.createElement(
            "style"
        );


    style.id =
        "cssImpressaoFechamento";


    style.textContent = `

        @media print {

            body * {
                visibility: hidden !important;
            }

            #modalDetalhesFechamento,
            #modalDetalhesFechamento * {
                visibility: visible !important;
            }

            #modalDetalhesFechamento {
                position: absolute !important;
                inset: 0 !important;
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
                background: #ffffff !important;
            }

            .fechamento-modal {
                position: static !important;
                width: 100% !important;
                max-width: none !important;
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                background: #ffffff !important;
                color: #111827 !important;
                box-shadow: none !important;
                border: none !important;
            }

            .fechamento-modal * {
                color: #111827 !important;
            }

            .fechamento-modal-close,
            .fechamento-modal-footer,
            #btnSalvarParecer,
            .parecer-contador,
            #parecerStatusSalvo {
                display: none !important;
            }

            .fechamento-modal-section,
            .parecer-gestor-section,
            .detalhe-resumo-card,
            .fechamento-criterio-card,
            .fechamento-destaque {
                break-inside: avoid;
            }

            input,
            textarea {
                border: 1px solid #d1d5db !important;
                background: #ffffff !important;
                color: #111827 !important;
            }

            table {
                width: 100% !important;
                border-collapse: collapse !important;
            }

            th,
            td {
                border-bottom: 1px solid #d1d5db !important;
            }

        }

    `;


    document.head.appendChild(
        style
    );


    // =============================================
    // IMPRIME
    // =============================================

    window.print();


    // =============================================
    // REMOVE CSS TEMPORÁRIO
    // =============================================

    setTimeout(
        () => {

            const estilo =
                document.getElementById(
                    "cssImpressaoFechamento"
                );


            if (estilo) {

                estilo.remove();

            }

        },
        500
    );

}

// =====================================================
// RESUMO INDIVIDUAL DO COLABORADOR
// =====================================================

function atualizarResumoIndividual(avaliacoes) {

    const funcionarioSelecionado =
        document.getElementById(
            "relatorioFuncionario"
        )?.value
        || "todos";


    const nomeElemento =
        document.getElementById(
            "individualNome"
        );

    const matriculaElemento =
        document.getElementById(
            "individualMatricula"
        );

    const mediaElemento =
        document.getElementById(
            "individualMedia"
        );

    const evolucaoElemento =
        document.getElementById(
            "individualEvolucao"
        );

    const melhorElemento =
        document.getElementById(
            "individualMelhor"
        );

    const melhorSemanaElemento =
        document.getElementById(
            "individualMelhorSemana"
        );

    const menorElemento =
        document.getElementById(
            "individualMenor"
        );

    const menorSemanaElemento =
        document.getElementById(
            "individualMenorSemana"
        );

    const classificacaoElemento =
        document.getElementById(
            "individualClassificacao"
        );


    if (
        !nomeElemento
        ||
        !mediaElemento
        ||
        !evolucaoElemento
    ) {
        return;
    }


    // =============================================
    // TODOS OS COLABORADORES
    // =============================================

    if (
        funcionarioSelecionado === "todos"
    ) {

        nomeElemento.textContent =
            "Todos os colaboradores";


        if (matriculaElemento) {

            matriculaElemento.textContent =
                "Selecione um colaborador";
        }


        mediaElemento.textContent =
            "0.0";


        evolucaoElemento.textContent =
            "0.0";


        evolucaoElemento.classList.remove(
            "relatorio-individual-positivo",
            "relatorio-individual-negativo",
            "relatorio-individual-neutro"
        );


        evolucaoElemento.classList.add(
            "relatorio-individual-neutro"
        );


        if (melhorElemento) {
            melhorElemento.textContent =
                "0";
        }


        if (melhorSemanaElemento) {

            melhorSemanaElemento.textContent =
                "-";
        }


        if (menorElemento) {
            menorElemento.textContent =
                "0";
        }


        if (menorSemanaElemento) {

            menorSemanaElemento.textContent =
                "-";
        }


        if (classificacaoElemento) {

            classificacaoElemento.textContent =
                "-";
        }


        return;
    }


    // =============================================
    // SEM AVALIAÇÕES
    // =============================================

    if (
        !avaliacoes
        ||
        avaliacoes.length === 0
    ) {

        const select =
            document.getElementById(
                "relatorioFuncionario"
            );


        const textoSelecionado =
            select?.options[
                select.selectedIndex
            ]?.textContent
            || "Colaborador";


        nomeElemento.textContent =
            textoSelecionado;


        if (matriculaElemento) {

            matriculaElemento.textContent =
                "Sem avaliações no período";
        }


        mediaElemento.textContent =
            "0.0";


        evolucaoElemento.textContent =
            "0.0";


        if (melhorElemento) {
            melhorElemento.textContent =
                "0";
        }


        if (melhorSemanaElemento) {

            melhorSemanaElemento.textContent =
                "-";
        }


        if (menorElemento) {
            menorElemento.textContent =
                "0";
        }


        if (menorSemanaElemento) {

            menorSemanaElemento.textContent =
                "-";
        }


        if (classificacaoElemento) {

            classificacaoElemento.textContent =
                "-";
        }


        return;
    }


    // =============================================
    // DADOS DO COLABORADOR
    // =============================================

    const primeira =
        avaliacoes[0];


    const nome =
        primeira.funcionarios?.nome
        || "Colaborador";


    const matricula =
        primeira.funcionarios?.matricula
        || "-";


    nomeElemento.textContent =
        nome;


    if (matriculaElemento) {

        matriculaElemento.textContent =
            `Matrícula: ${matricula}`;
    }


    // =============================================
    // ORDENA DA MAIS ANTIGA PARA A MAIS NOVA
    // =============================================

    const ordenadas =
        [...avaliacoes]
            .sort((a, b) => {

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
                    dataA - dataB
                );
            });


    const notas =
        ordenadas.map(
            avaliacao =>
                Number(
                    avaliacao.nota_final
                    || 0
                )
        );


    // =============================================
    // MÉDIA
    // =============================================

    const soma =
        notas.reduce(
            (total, nota) =>
                total + nota,
            0
        );


    const media =
        soma / notas.length;


    mediaElemento.textContent =
        media.toFixed(1);


    // =============================================
    // MELHOR RESULTADO
    // =============================================

    let melhorAvaliacao =
        ordenadas[0];


    ordenadas.forEach(
        avaliacao => {

            if (
                Number(
                    avaliacao.nota_final
                    || 0
                )
                >
                Number(
                    melhorAvaliacao.nota_final
                    || 0
                )
            ) {

                melhorAvaliacao =
                    avaliacao;
            }
        }
    );


    if (melhorElemento) {

        melhorElemento.textContent =
            Number(
                melhorAvaliacao.nota_final
                || 0
            ).toFixed(1);
    }


    if (melhorSemanaElemento) {

        melhorSemanaElemento.textContent =
            `Semana ${
                melhorAvaliacao.semana
                || "-"
            }`;
    }


    // =============================================
    // MENOR RESULTADO
    // =============================================

    let menorAvaliacao =
        ordenadas[0];


    ordenadas.forEach(
        avaliacao => {

            if (
                Number(
                    avaliacao.nota_final
                    || 0
                )
                <
                Number(
                    menorAvaliacao.nota_final
                    || 0
                )
            ) {

                menorAvaliacao =
                    avaliacao;
            }
        }
    );


    if (menorElemento) {

        menorElemento.textContent =
            Number(
                menorAvaliacao.nota_final
                || 0
            ).toFixed(1);
    }


    if (menorSemanaElemento) {

        menorSemanaElemento.textContent =
            `Semana ${
                menorAvaliacao.semana
                || "-"
            }`;
    }


    // =============================================
    // EVOLUÇÃO
    // =============================================

    let evolucao =
        0;


    if (
        ordenadas.length >= 2
    ) {

        const primeiraNota =
            Number(
                ordenadas[0].nota_final
                || 0
            );


        const ultimaNota =
            Number(
                ordenadas[
                    ordenadas.length - 1
                ].nota_final
                || 0
            );


        evolucao =
            ultimaNota
            -
            primeiraNota;
    }


    evolucaoElemento.textContent =
        evolucao > 0
            ? `+${evolucao.toFixed(1)}`
            : evolucao.toFixed(1);


    evolucaoElemento.classList.remove(
        "relatorio-individual-positivo",
        "relatorio-individual-negativo",
        "relatorio-individual-neutro"
    );


    if (evolucao > 0) {

        evolucaoElemento.classList.add(
            "relatorio-individual-positivo"
        );

    }

    else if (evolucao < 0) {

        evolucaoElemento.classList.add(
            "relatorio-individual-negativo"
        );

    }

    else {

        evolucaoElemento.classList.add(
            "relatorio-individual-neutro"
        );
    }


    // =============================================
    // CLASSIFICAÇÃO ATUAL
    // =============================================

    const ultimaAvaliacao =
        ordenadas[
            ordenadas.length - 1
        ];


    const classificacaoAtual =
        ultimaAvaliacao.classificacao
        ||
        obterClassificacaoRelatorio(
            Number(
                ultimaAvaliacao.nota_final
                || 0
            )
        );


    if (classificacaoElemento) {

        classificacaoElemento.textContent =
            classificacaoAtual;
    }

}
// =====================================================
// DESEMPENHO POR CRITÉRIO
// =====================================================

// =====================================================
// DESEMPENHO POR CRITÉRIO
// =====================================================

// =====================================================
// DESEMPENHO POR CRITÉRIO - PERCENTUAL
// =====================================================

function atualizarDesempenhoCriterios(avaliacoes) {

    const criterios = [

        {
            campo: "produtividade",
            nome: "Produtividade",
            elemento: "criterioProdutividade",
            maximo: 15
        },

        {
            campo: "prazo",
            nome: "Prazo",
            elemento: "criterioPrazo",
            maximo: 10
        },

        {
            campo: "qualidade",
            nome: "Qualidade",
            elemento: "criterioQualidade",
            maximo: 15
        },

        {
            campo: "conhecimento_tecnico",
            nome: "Conhecimento técnico",
            elemento: "criterioConhecimentoTecnico",
            maximo: 15
        },

        {
            campo: "proatividade",
            nome: "Proatividade",
            elemento: "criterioProatividade",
            maximo: 10
        },

        {
            campo: "trabalho_equipe",
            nome: "Trabalho em equipe",
            elemento: "criterioTrabalhoEquipe",
            maximo: 15
        },

        {
            campo: "adaptabilidade",
            nome: "Adaptabilidade",
            elemento: "criterioAdaptabilidade",
            maximo: 10
        },

        {
            campo: "responsabilidade",
            nome: "Responsabilidade",
            elemento: "criterioResponsabilidade",
            maximo: 10
        }

    ];


    function limpar() {

        criterios.forEach(criterio => {

            const elemento =
                document.getElementById(
                    criterio.elemento
                );

            if (elemento) {
                elemento.textContent = "0.0%";
            }

        });


        const forteNome =
            document.getElementById(
                "criterioPontoForteNome"
            );

        const forteNota =
            document.getElementById(
                "criterioPontoForteNota"
            );

        const atencaoNome =
            document.getElementById(
                "criterioPontoAtencaoNome"
            );

        const atencaoNota =
            document.getElementById(
                "criterioPontoAtencaoNota"
            );


        if (forteNome) {
            forteNome.textContent = "-";
        }

        if (forteNota) {
            forteNota.textContent = "0.0%";
        }

        if (atencaoNome) {
            atencaoNome.textContent = "-";
        }

        if (atencaoNota) {
            atencaoNota.textContent = "0.0%";
        }

    }


    if (
        !Array.isArray(avaliacoes)
        ||
        avaliacoes.length === 0
    ) {

        limpar();
        return;
    }


    const resultados =
        criterios.map(criterio => {

            const valores =
                avaliacoes

                    .map(avaliacao =>
                        Number(
                            avaliacao[
                                criterio.campo
                            ]
                        )
                    )

                    .filter(valor =>
                        Number.isFinite(valor)
                    );


            const mediaPontos =
                valores.length > 0
                    ? valores.reduce(
                        (total, valor) =>
                            total + valor,
                        0
                    ) / valores.length
                    : 0;


            const percentual =
                criterio.maximo > 0
                    ? (
                        mediaPontos /
                        criterio.maximo
                    ) * 100
                    : 0;


            const percentualLimitado =
                Math.max(
                    0,
                    Math.min(
                        100,
                        percentual
                    )
                );


            const elemento =
                document.getElementById(
                    criterio.elemento
                );


            if (elemento) {

                elemento.textContent =
                    `${percentualLimitado.toFixed(1)}%`;
            }


            return {

                nome:
                    criterio.nome,

                mediaPontos:
                    mediaPontos,

                maximo:
                    criterio.maximo,

                percentual:
                    percentualLimitado

            };

        });


    const validos =
        resultados.filter(
            item =>
                Number.isFinite(
                    item.percentual
                )
        );


    if (validos.length === 0) {

        limpar();
        return;
    }


    const ordenados =
        [...validos].sort(
            (a, b) =>
                b.percentual -
                a.percentual
        );


    const pontoForte =
        ordenados[0];


    const pontoAtencao =
        ordenados[
            ordenados.length - 1
        ];


    const forteNome =
        document.getElementById(
            "criterioPontoForteNome"
        );

    const forteNota =
        document.getElementById(
            "criterioPontoForteNota"
        );

    const atencaoNome =
        document.getElementById(
            "criterioPontoAtencaoNome"
        );

    const atencaoNota =
        document.getElementById(
            "criterioPontoAtencaoNota"
        );


    if (forteNome) {

        forteNome.textContent =
            pontoForte.nome;
    }


    if (forteNota) {

        forteNota.textContent =
            `${pontoForte.percentual.toFixed(1)}%`;
    }


    if (atencaoNome) {

        atencaoNome.textContent =
            pontoAtencao.nome;
    }


    if (atencaoNota) {

        atencaoNota.textContent =
            `${pontoAtencao.percentual.toFixed(1)}%`;
    }


    console.log(
        "Desempenho percentual por critério:",
        resultados
    );

}

// =====================================================
// NORMALIZA NOME DO CRITÉRIO
// =====================================================

function normalizarCriterioRelatorio(valor) {

    return String(
        valor || ""
    )

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .toLowerCase()

        .replace(
            /[^a-z0-9]/g,
            ""
        );
}