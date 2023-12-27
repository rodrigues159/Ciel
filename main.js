require('dotenv').config();
const { Client, Intents } = require('discord.js');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGES, // Adiciona a intenção de ler mensagens
  ]
});

const canaisTemporarios = new Set();
const criadoresDeCanais = new Map();

client.once('ready', () => {
  console.log(`Logado como ${client.user.tag}!`);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (newState.channelId === process.env.ID_CANAL_CRIADOR && newState.member && !newState.member.user.bot) {
    const channelName = newState.member.user.username ? `Canal de ${newState.member.user.username}` : 'Canal Temporário';
    const channelOptions = {
      type: 'GUILD_VOICE',
      parent: process.env.ID_CATEGORIA_CANAL_TEMPORARIO,
    };

    try {
      const newChannel = await newState.guild.channels.create(channelName, channelOptions);
      console.log(`Canal criado: ${newChannel.name}`);
      canaisTemporarios.add(newChannel.id); // Adiciona o ID do canal ao conjunto
      criadoresDeCanais.set(newChannel.id, newState.member.user.id); // Armazena o criador do canal
      await newState.setChannel(newChannel);
    } catch (error) {
      console.error('Erro ao criar o canal:', error);
    }
  }

  if (oldState.channelId && oldState.channelId !== newState.channelId) {
    const channel = oldState.channel;
    if (channel && channel.members.size === 0 && canaisTemporarios.has(channel.id)) {
      console.log(`Deletando canal vazio: ${channel.name}`);
      channel.delete().catch(console.error);
      canaisTemporarios.delete(channel.id); // Remove o ID do canal do conjunto
      criadoresDeCanais.delete(channel.id); // Remove o criador do canal do registro
    }
  }
});

client.on('messageCreate', async message => {
  if (message.content.startsWith('!mudarnome') && message.member.voice.channel) {
    const novoNome = message.content.split(' ')[1];
    const channelId = message.member.voice.channel.id;

    if (criadoresDeCanais.get(channelId) === message.author.id) {
      // O usuário é o criador do canal, pode mudar o nome
      message.member.voice.channel.setName(novoNome)
        .then(updated => console.log(`Canal renomeado para ${updated.name}`))
        .catch(console.error);
    } else {
      // O usuário não é o criador do canal
      message.reply('Você não tem permissão para mudar o nome deste canal.');
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
