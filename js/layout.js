function carregarLayout(paginaAtiva = "") {

    const sidebar = document.getElementById("appSidebar");

    if (!sidebar) return;

    sidebar.innerHTML = `
        <div class="v2-brand">
            <div class="v2-brand-icon">GD</div>

            <div>
                <strong>Gestão</strong>
                <span>Desempenho</span>
            </div>
        </div>

        <nav class="v2-menu">

            <a href="dashboard.html"
               class="${paginaAtiva === "dashboard" ? "active" : ""}">
                <span>▦</span>
                Dashboard
            </a>

            <a href="funcionarios.html"
               class="${paginaAtiva === "funcionarios" ? "active" : ""}">
                <span>♙</span>
                Funcionários
            </a>

            <a href="avaliacoes.html"
               class="${paginaAtiva === "avaliacoes" ? "active" : ""}">
                <span>✎</span>
                Avaliações
            </a>

            <a href="ranking.html"
               class="${paginaAtiva === "ranking" ? "active" : ""}">
                <span>♛</span>
                Ranking
            </a>

            <a href="relatorios.html"
               class="${paginaAtiva === "relatorios" ? "active" : ""}">
                <span>▥</span>
                Relatórios
            </a>

            <a href="configuracoes.html"
               class="${paginaAtiva === "configuracoes" ? "active" : ""}">
                <span>⚙</span>
                Configurações
            </a>

        </nav>

        <div class="v2-sidebar-bottom">

            <div class="v2-status">
                <span class="v2-status-dot"></span>

                <div>
                    <strong>Sistema Online</strong>
                    <small>Supabase conectado</small>
                </div>
            </div>

        </div>
    `;
}