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
// CARREGA FECHAMENTOS DO SUPABASE
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
        Number(partes[0]);

    const mes =
        Number(partes[1]);


    mostrarCarregandoFechamento();


    try {

        // =============================================
        // BUSCA OS FECHAMENTOS
        // =============================================

        const {
            data: fechamentos,
            error: erroFechamentos
        } = await supabaseClient

            .from("fechamentos_mensais")

            .select(`
                id,
                funcionario_id,
                ano,
                mes,
                media_tecnica,
                nota_final_gestor,
                classificacao,
                parecer_final,
                fechado_por,
                fechado_em,
                status,
                created_at,
                updated_at
            `)

            .eq("ano", ano)

            .eq("mes", mes)

            .order(
                "media_tecnica",
                {
                    ascending: false
                }
            );


        if (erroFechamentos) {
            throw erroFechamentos;
        }


        const lista =
            fechamentos || [];


        // =============================================
        // BUSCA OS FUNCIONÁRIOS
        // =============================================

        const idsFuncionarios =
            [
                ...new Set(
                    lista
                        .map(item =>
                            item.funcionario_id
                        )
                        .filter(Boolean)
                )
            ];


        let mapaFuncionarios = {};


        if (idsFuncionarios.length > 0) {

            const {
                data: funcionarios,
                error: erroFuncionarios
            } = await supabaseClient

                .from("funcionarios")

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


            (funcionarios || [])
                .forEach(funcionario => {

                    mapaFuncionarios[
                        funcionario.id
                    ] = funcionario;

                });
        }


        // =============================================
        // JUNTA FECHAMENTO + FUNCIONÁRIO
        // =============================================

        fechamentoMensalBase =
            lista.map(item => ({

                ...item,

                funcionario:
                    mapaFuncionarios[
                        item.funcionario_id
                    ]
                    || null

            }));


        console.log(
            "Fechamento mensal carregado:",
            fechamentoMensalBase
        );


        atualizarFechamentoMensal();

    }

    catch (erro) {

        console.error(
            "Erro ao carregar fechamento mensal:",
            erro
        );

        fechamentoMensalBase = [];

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
                    colspan="6"
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
        String(item.status || "aberto").toLowerCase() === "fechado"
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
                    colspan="6"
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
                    colspan="6"
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

async function abrirDetalhesFechamento(fechamentoId) {

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


    // Abre o modal já em estado de carregamento
    modal.classList.add("active");


    resumo.innerHTML = `
        <div class="detalhe-resumo-card">
            <small>Colaborador</small>
            <strong>Carregando...</strong>
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


    try {

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


        const inicioCompetencia =
            `${ano}-${String(mes)
                .padStart(2, "0")}-01`;


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
            `${proximoAno}-${String(proximoMes)
                .padStart(2, "0")}-01`;


        // =============================================
        // BUSCA AS AVALIAÇÕES QUE FORMARAM O MÊS
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
                    created_at
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
        // TENTA IDENTIFICAR QUEM FECHOU
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


            // Não interrompe o modal caso
            // a leitura do perfil seja bloqueada.
            if (!erroPerfil && perfil) {

                responsavelFechamento =
                    perfil.nome_exibicao
                    || "Usuário do sistema";
            }

            else {

                responsavelFechamento =
                    "Usuário do sistema";

                if (erroPerfil) {

                    console.warn(
                        "Não foi possível identificar o responsável pelo fechamento:",
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
            || "Funcionário";


        const matricula =
            fechamento.funcionario?.matricula
            || "-";


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
        // RESUMO
        // =============================================

        resumo.innerHTML = `

            <div class="detalhe-resumo-card">

                <small>
                    Colaborador
                </small>

                <strong>
                    ${escaparHTMLDetalhes(nome)}
                </strong>

            </div>


            <div class="detalhe-resumo-card">

                <small>
                    Matrícula
                </small>

                <strong>
                    ${escaparHTMLDetalhes(matricula)}
                </strong>

            </div>


            <div class="detalhe-resumo-card">

                <small>
                    Competência
                </small>

                <strong>
                    ${escaparHTMLDetalhes(periodo)}
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
        // CONTADOR
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
        // TABELA SEMANAL
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


        tbody.innerHTML =
            listaAvaliacoes

                .map(avaliacao => {

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
                                ${avaliacao.semana || "-"}
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

                })

                .join("");


        console.log(
            "Detalhes do fechamento carregados:",
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
                <small>Erro</small>
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

    }

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
// FORMATA DATA E HORA DO FECHAMENTO
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
// PROTEGE TEXTO USADO NO HTML
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