document.addEventListener("DOMContentLoaded", async () => {
    await carregarDashboard();
});

async function carregarDashboard() {
    try {
        await Promise.all([
            carregarFuncionariosAtivos(),
            carregarAvaliacoesDashboard()
        ]);
    } catch (erro) {
        console.error("Erro ao carregar dashboard:", erro);
    }
}


// =====================================================
// FUNCIONÁRIOS ATIVOS
// =====================================================

async function carregarFuncionariosAtivos() {
    const { count, error } = await supabaseClient
        .from("funcionarios")
        .select("*", {
            count: "exact",
            head: true
        })
        .eq("status", "Ativo");

    if (error) {
        console.error(
            "Erro ao contar funcionários:",
            error
        );
        return;
    }

    const elemento =
        document.getElementById("kpiFuncionarios");

    if (elemento) {
        elemento.textContent = count || 0;
    }
}


// =====================================================
// AVALIAÇÕES
// =====================================================

async function carregarAvaliacoesDashboard() {
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
            "Erro ao carregar avaliações:",
            error
        );
        return;
    }

    const avaliacoes = data || [];

    atualizarQuantidadeAvaliacoes(avaliacoes);
    atualizarMediaGeral(avaliacoes);
    atualizarMelhorDesempenho(avaliacoes);
    atualizarClassificacoes(avaliacoes);
    atualizarRanking(avaliacoes);
    atualizarUltimasAvaliacoes(avaliacoes);
}


// =====================================================
// QUANTIDADE DE AVALIAÇÕES
// =====================================================

function atualizarQuantidadeAvaliacoes(avaliacoes) {
    const elemento =
        document.getElementById("kpiAvaliacoes");

    if (elemento) {
        elemento.textContent =
            avaliacoes.length;
    }
}


// =====================================================
// MÉDIA GERAL
// =====================================================

function atualizarMediaGeral(avaliacoes) {
    let media = 0;

    if (avaliacoes.length > 0) {
        const soma =
            avaliacoes.reduce(
                (total, avaliacao) =>
                    total +
                    Number(avaliacao.nota_final || 0),
                0
            );

        media =
            soma / avaliacoes.length;
    }

    const mediaFormatada =
        media.toFixed(1);

    const kpiMedia =
        document.getElementById("kpiMedia");

    const dashboardNotaMedia =
        document.getElementById(
            "dashboardNotaMedia"
        );

    if (kpiMedia) {
        kpiMedia.textContent =
            mediaFormatada;
    }

    if (dashboardNotaMedia) {
        dashboardNotaMedia.textContent =
            mediaFormatada;
    }
}


// =====================================================
// MELHOR DESEMPENHO
// =====================================================

function atualizarMelhorDesempenho(avaliacoes) {
    const elemento =
        document.getElementById("kpiMelhor");

    if (!elemento) return;

    if (avaliacoes.length === 0) {
        elemento.textContent = "-";
        return;
    }

    const melhor =
        [...avaliacoes].sort(
            (a, b) =>
                Number(b.nota_final) -
                Number(a.nota_final)
        )[0];

    const nome =
        melhor.funcionarios?.nome ||
        "Funcionário";

    elemento.textContent =
        `${nome} · ${melhor.nota_final}`;
}


// =====================================================
// CONTAGEM POR CLASSIFICAÇÃO
// =====================================================

function atualizarClassificacoes(avaliacoes) {
    let excelente = 0;
    let bom = 0;
    let atencao = 0;
    let critico = 0;

    avaliacoes.forEach(avaliacao => {
        const nota =
            Number(avaliacao.nota_final || 0);

        if (nota >= 90) {
            excelente++;
        } else if (nota >= 70) {
            bom++;
        } else if (nota >= 60) {
            atencao++;
        } else {
            critico++;
        }
    });

    definirTexto(
        "statusExcelente",
        excelente
    );

    definirTexto(
        "statusBom",
        bom
    );

    definirTexto(
        "statusAtencao",
        atencao
    );

    definirTexto(
        "statusCritico",
        critico
    );
}


// =====================================================
// RANKING
// =====================================================

function atualizarRanking(avaliacoes) {
    const container =
        document.getElementById(
            "dashboardRanking"
        );

    if (!container) return;

    if (avaliacoes.length === 0) {
        container.innerHTML = `
            <div class="ranking-empty">
                Nenhum dado disponível.
            </div>
        `;
        return;
    }

    const agrupado = {};

    avaliacoes.forEach(avaliacao => {
        const funcionarioId =
            avaliacao.funcionario_id;

        if (!agrupado[funcionarioId]) {
            agrupado[funcionarioId] = {
                nome:
                    avaliacao.funcionarios?.nome ||
                    "Funcionário",
                total: 0,
                quantidade: 0
            };
        }

        agrupado[funcionarioId].total +=
            Number(
                avaliacao.nota_final || 0
            );

        agrupado[funcionarioId].quantidade++;
    });

    const ranking =
        Object.values(agrupado)
            .map(item => ({
                nome: item.nome,
                media:
                    item.total /
                    item.quantidade
            }))
            .sort(
                (a, b) =>
                    b.media - a.media
            )
            .slice(0, 5);

    container.innerHTML =
        ranking
            .map((item, indice) => `
                <div class="dashboard-ranking-item">
                    <span class="ranking-position">
                        ${indice + 1}
                    </span>

                    <div class="ranking-person">
                        <strong>
                            ${item.nome}
                        </strong>

                        <small>
                            Média de desempenho
                        </small>
                    </div>

                    <strong class="ranking-score">
                        ${item.media.toFixed(1)}
                    </strong>
                </div>
            `)
            .join("");
}


// =====================================================
// ÚLTIMAS AVALIAÇÕES
// =====================================================

function atualizarUltimasAvaliacoes(avaliacoes) {
    const container =
        document.getElementById(
            "dashboardAvaliacoes"
        );

    if (!container) return;

    if (avaliacoes.length === 0) {
        container.innerHTML = `
            <div class="ranking-empty">
                Nenhuma avaliação registrada.
            </div>
        `;
        return;
    }

    const ultimas =
        avaliacoes.slice(0, 5);

    container.innerHTML =
        ultimas
            .map(avaliacao => {
                const nome =
                    avaliacao.funcionarios?.nome ||
                    "Funcionário";

                const nota =
                    Number(
                        avaliacao.nota_final || 0
                    );

                const data =
                    formatarData(
                        avaliacao.created_at
                    );

                return `
                    <div class="dashboard-activity-item">

                        <div>
                            <strong>
                                ${nome}
                            </strong>

                            <small>
                                ${data}
                            </small>
                        </div>

                        <span class="activity-score">
                            ${nota}
                        </span>

                    </div>
                `;
            })
            .join("");
}


// =====================================================
// UTILITÁRIOS
// =====================================================

function definirTexto(id, valor) {
    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.textContent = valor;
    }
}


function formatarData(dataISO) {
    if (!dataISO) {
        return "-";
    }

    return new Date(
        dataISO
    ).toLocaleDateString(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}