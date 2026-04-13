const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require("discord.js");
const chalk = require("chalk");
const { pegarNoticias } = require("../services/gnews");
const { resumirNoticias } = require("../services/ai");
const { salvarSentimento } = require("../services/storage");

async function processarNoticias(context, topico) {
  console.log(`[News] Iniciando processarNoticias para: ${topico}`);
  try {
    const isInteraction = context.isChatInputCommand?.() || context.isStringSelectMenu?.();
    const user = isInteraction ? context.user : context.author;

    const noticias = await pegarNoticias(topico);
    console.log(`[News] Notícias recebidas: ${noticias.length}`);

    if (noticias.length === 0) {
      const resp = `❌ Nenhuma notícia encontrada sobre "${topico}".`;
      return isInteraction ? (context.deferred ? context.editReply(resp) : context.reply(resp)) : context.channel.send(resp);
    }

    const embedNoticias = new EmbedBuilder()
      .setTitle(`📰 Notícias: ${topico.toUpperCase()}`)
      .setColor(0x0099FF)
      .setTimestamp()
      .setFooter({ text: "Via GNews API" });

    const noticiaComImagem = noticias.find(n => n.image);
    if (noticiaComImagem) embedNoticias.setImage(noticiaComImagem.image);

    noticias.forEach(n => {
      embedNoticias.addFields({ name: n.title, value: `[Ler notícia completa](${n.url})` });
    });

    try {
        if (isInteraction) await context.followUp({ embeds: [embedNoticias] });
        else await context.channel.send({ embeds: [embedNoticias] });
    } catch (e) {
        console.error("Erro no primeiro embed, tentando sem imagem...");
        embedNoticias.setImage(null);
        if (isInteraction) await context.followUp({ embeds: [embedNoticias] });
        else await context.channel.send({ embeds: [embedNoticias] });
    }

    const rawAi = await resumirNoticias(noticias);
    const dataAi = {
        resumo: rawAi.resumo || rawAi.Resumo || "Sem resumo disponível.",
        sentimento: rawAi.sentimento || rawAi.Sentimento || "Neutro",
        pontuacao: rawAi.pontuacao || rawAi.Pontuacao || 5
    };

    const pontuacao = Math.min(Math.max(dataAi.pontuacao, 0), 10);
    const progresso = "█".repeat(pontuacao) + "░".repeat(10 - pontuacao);
    const corSentimento = dataAi.sentimento === "Positivo" ? 0x2ECC71 : (dataAi.sentimento === "Negativo" ? 0xE74C3C : 0xF1C40F);

    salvarSentimento({ topico, pontuacao, sentimento: dataAi.sentimento });

    const embedResumo = new EmbedBuilder()
      .setTitle("🧠 Resumo e Análise de Sentimento")
      .setColor(corSentimento)
      .setDescription(dataAi.resumo)
      .addFields(
        { name: "Vibe Geral", value: dataAi.sentimento, inline: true },
        { name: "Impacto", value: `\`${progresso}\` (${pontuacao}/10)`, inline: true }
      )
      .setTimestamp();

    if (isInteraction) await context.followUp({ embeds: [embedResumo] });
    else await context.channel.send({ embeds: [embedResumo] });

  } catch (err) {
    console.error(err);
    const erroMsg = "❌ Erro ao processar o seu pedido.";
    try {
        if (context.isChatInputCommand?.() || context.isStringSelectMenu?.()) {
            await context.followUp(erroMsg);
        } else {
            await context.channel.send(erroMsg);
        }
    } catch (e) { console.error("Erro ao enviar mensagem de erro:", e); }
  }
}

module.exports = {
  async execute(context) {
    console.log(`[Execute] Comando iniciado por: ${context.user?.tag || context.author?.tag}`);
    try {
      const isInteraction = context.isChatInputCommand?.();
      const isSelect = context.isStringSelectMenu?.();
      
      if (isInteraction) {
        const topico = context.options.getString('topico');
        if (topico) {
            console.log(`[Execute-Slash] Tópico encontrado: ${topico}. Enviando editReply...`);
            await context.editReply(`🔎 Buscando notícias sobre **${topico}**...`);
            return processarNoticias(context, topico);
        }
      } else if (isSelect) {
        const topico = context.values[0];
        console.log(`[Execute-Menu] Tópico selecionado: ${topico}. Atualizando mensagem...`);
        await context.update({ content: `✅ Selecionado: **${topico}**. Analisando...`, components: [] });
        return processarNoticias(context, topico);
      } else {
        const args = context.content.split(" ");
        const topico = args[1];
        if (topico) {
          console.log(`[Execute-Legado] Tópico: ${topico}`);
          context.reply(`🔎 Buscando notícias sobre **${topico}**...`);
          return processarNoticias(context, topico);
        }
      }

      const select = new StringSelectMenuBuilder()
        .setCustomId('select_topico')
        .setPlaceholder('Escolha um tópico de notícias...')
        .addOptions(
          { label: 'Tecnologia', description: 'Novidades do mundo tech', value: 'tecnologia' },
          { label: 'Negócios', description: 'Economia e mercado financeiro', value: 'negocios' },
          { label: 'Entretenimento', description: 'Filmes, séries e celebridades', value: 'entretenimento' },
          { label: 'Esportes', description: 'Futebol, basquete e outros', value: 'esportes' },
          { label: 'Ciência', description: 'Descobertas e astronomia', value: 'ciencia' },
          { label: 'Saúde', description: 'Medicina e bem-estar', value: 'saude' },
        );

      const row = new ActionRowBuilder().addComponents(select);

      if (isInteraction) {
          await context.editReply({ content: '🧐 Qual assunto você gostaria de ler hoje?', components: [row] });
      } else {
          const response = await context.reply({ content: '🧐 Qual assunto você gostaria de ler hoje?', components: [row] });
          const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 30_000 });
          collector.on('collect', async (i) => {
              if (i.user.id !== context.author.id) return i.reply({ content: "Você não pode usar este menu!", ephemeral: true });
              const choice = i.values[0];
              await i.update({ content: `✅ Selecionado: **${choice}**. Buscando...`, components: [] });
              await processarNoticias(context, choice);
          });
          collector.on('end', c => { if (c.size === 0) response.edit({ content: '⏰ Tempo esgotado.', components: [] }); });
      }
    } catch (err) {
      console.error(chalk.red("[Execute Error]"), err);
    }
  }
};
