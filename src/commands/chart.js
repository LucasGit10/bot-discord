const { EmbedBuilder } = require("discord.js");
const { buscarHistorico } = require("../services/storage");

module.exports = {
  async execute(context) {
    const isInteraction = context.isChatInputCommand?.();
    let topico = "";

    if (isInteraction) {
      await context.deferReply();
      topico = context.options.getString('topico');
    } else {
      const args = context.content.split(" ");
      topico = args[1];
    }

    if (!topico) {
      const msg = "❌ Por favor, informe o tópico (ex: `/grafico tecnologia` ou `!grafico tecnologia`).";
      return isInteraction ? context.editReply(msg) : context.reply(msg);
    }

    const historico = buscarHistorico(topico);

    if (historico.length < 2) {
      const msg = `⚠️ Dados insuficientes para o tópico **${topico}**. Busque mais notícias primeiro para gerar uma tendência!`;
      return isInteraction ? context.editReply(msg) : context.reply(msg);
    }

    const ultimosDados = historico.slice(-10);
    const labels = ultimosDados.map(h => {
        const d = new Date(h.data);
        return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${d.getMinutes()}`;
    });
    const scores = ultimosDados.map(h => h.pontuacao);

    const chartConfig = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `Sentimento: ${topico}`,
          data: scores,
          fill: true,
          backgroundColor: 'rgba(0, 153, 255, 0.2)',
          borderColor: 'rgba(0, 153, 255, 1)',
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: 'white',
          tension: 0.4
        }]
      },
      options: {
        title: {
          display: true,
          text: `Tendência de Sentimento - ${topico.toUpperCase()}`,
          fontColor: 'white',
          fontSize: 20
        },
        legend: {
          labels: { fontColor: 'white' }
        },
        scales: {
          yAxes: [{
            ticks: { beginAtZero: true, max: 10, fontColor: 'white' },
            gridLines: { color: 'rgba(255, 255, 255, 0.1)' }
          }],
          xAxes: [{
            ticks: { fontColor: 'white' },
            gridLines: { color: 'rgba(255, 255, 255, 0.1)' }
          }]
        }
      }
    };

    const chartUrl = `https://quickchart.io/chart?width=800&height=400&format=png&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;

    const embed = new EmbedBuilder()
      .setTitle(`📈 Histórico de Sentimento: ${topico.toUpperCase()}`)
      .setDescription(`Acompanhe como a percepção da IA sobre **${topico}** mudou ao longo do tempo.`)
      .setImage(chartUrl)
      .setColor(0x0099FF)
      .setTimestamp()
      .setFooter({ text: "Dados processados via Groq AI & QuickChart" });

    if (isInteraction) {
      await context.editReply({ embeds: [embed] });
    } else {
      await context.reply({ embeds: [embed] });
    }
  }
};
