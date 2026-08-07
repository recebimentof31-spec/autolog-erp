document.addEventListener("DOMContentLoaded", async () => {
    await carregarFuncionarios();
    configurarSliders();
    atualizarNota();
});

async function carregarFuncionarios() {
    const select = document.getElementById("funcionario");

    select.innerHTML = '<option value="">Carregando...</option>';

    const { data, error } = await supabaseClient
        .from("funcionarios")
        .select("id, nome, matricula, cargo, setor, status")
        .eq("status", "Ativo")
        .order("nome", { ascending: true });

    if (error) {
        console.error("Erro ao carregar funcionários:", error);

        select.innerHTML =
            '<option value="">Erro ao carregar funcionários</option>';

        return;
    }

    select.innerHTML =
        '<option value="">Selecione um funcionário</option>';

    data.forEach(funcionario => {
        const option = document.createElement("option");

        option.value = funcionario.id;

        option.textContent =
            `${funcionario.nome} - ${funcionario.matricula || "Sem matrícula"}`;

        select.appendChild(option);
    });

    console.log("Funcionários carregados:", data);
}

function configurarSliders() {
    const sliders = [
        "organizacao",
        "coletividade",
        "limpeza",
        "efetividade",
        "conferencia",
        "agilidade"
    ];

    sliders.forEach(id => {
        const slider = document.getElementById(id);

        if (slider) {
            slider.addEventListener("input", atualizarNota);
        }
    });
}

function atualizarNota() {
    const organizacao =
        Number(document.getElementById("organizacao").value);

    const coletividade =
        Number(document.getElementById("coletividade").value);

    const limpeza =
        Number(document.getElementById("limpeza").value);

    const efetividade =
        Number(document.getElementById("efetividade").value);

    const conferencia =
        Number(document.getElementById("conferencia").value);

    const agilidade =
        Number(document.getElementById("agilidade").value);

    document.getElementById("organizacaoValor").textContent =
        organizacao;

    document.getElementById("coletividadeValor").textContent =
        coletividade;

    document.getElementById("limpezaValor").textContent =
        limpeza;

    document.getElementById("efetividadeValor").textContent =
        efetividade;

    document.getElementById("conferenciaValor").textContent =
        conferencia;

    document.getElementById("agilidadeValor").textContent =
        agilidade;

    const nota =
        organizacao +
        coletividade +
        limpeza +
        efetividade +
        conferencia +
        agilidade;

    document.getElementById("notaFinal").textContent =
        nota;
}