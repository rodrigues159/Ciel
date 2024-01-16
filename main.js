require('dotenv').config();
const fs = require('fs');
const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent,  } = require('discord.js');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS
  ]
});

let canaisTemporarios = new Set();
let criadoresDeCanais;

// Carregar dados dos canais no início
try {
  const dadosCarregados = JSON.parse(fs.readFileSync('dadosCanais.json', 'utf-8'));
  criadoresDeCanais = new Map(dadosCarregados.canais.map(entry => [entry.idchannel, entry.ownerChannel]));
} catch (error) {
  criadoresDeCanais = new Map();
}

function salvarDados() {
  const dadosParaSalvar = {
    canais: Array.from(criadoresDeCanais).map(([idchannel, ownerChannel]) => ({ idchannel, ownerChannel })),
  };
  fs.writeFileSync('dadosCanais.json', JSON.stringify(dadosParaSalvar, null, 2), 'utf-8');
}

// Função para criar a interface de botões
function criarInterfaceDeBotao() {
  const embed = new MessageEmbed()
    .setColor('#0099ff')
    .setTitle('Manas: Ciel - Interface')
    .setDescription('Essa interface pode ser usada para gerenciar canais de voz temporários.')
    .setImage('https://imgur.com/CdnlDoT.png') // Substitua pela URL da imagem que deseja usar
    .setFooter('Pressione os botões abaixo para usar a interface');

  const row = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setLabel('')
        .setEmoji('<:iconname:1189753859250331740> ')
        .setCustomId('cname')
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId(SetMaxMembers.getCustomId())
        .setLabel('')
        .setEmoji('<:limitMembers:1190116297166553088>')
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId('privacyOptions')
        .setLabel('')
        .setEmoji('<:privacyOptions:1190341360428007484>')
        .setStyle('SECONDARY')
      // Adicione mais botões conforme necessário
    );
  // Continuar adicionando rows e botões conforme necessário

  return { embeds: [embed], components: [row] };
}

function lerDadosCanais() {
  try {
    const dados = fs.readFileSync('dadosCanais.json', 'utf-8');
    return JSON.parse(dados).canais;
  } catch (error) {
    console.error('Erro ao ler dados dos canais:', error);
    return [];
  }
}

client.once('ready', async () => {
  console.log(`Logado como ${client.user.tag}!`);

  const canalInterface = client.channels.cache.get(process.env.ID_CANAL_INTERFACE);

  if (canalInterface) {
    try {
      // Buscar mensagens anteriores do bot no canal de interface
      const messages = await canalInterface.messages.fetch({ limit: 100 });
      const botMessages = messages.filter(m => m.author.id === client.user.id);

      // Excluir todas as mensagens antigas do bot
      for (const message of botMessages.values()) {
        await message.delete();
      }

      // Enviar a nova interface
      await canalInterface.send(criarInterfaceDeBotao());

    } catch (error) {
      console.error('Erro ao limpar o canal de interface ou ao enviar a nova mensagem:', error);
    }
  }
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (newState.channelId === process.env.ID_CANAL_CRIADOR && newState.member && !newState.member.user.bot) {
    const channelName = newState.member.user.username ? `Canal de ${newState.member.user.username}` : 'Canal Temporário';
    const channelOptions = {
      type: 'GUILD_VOICE',
      parent: process.env.ID_CATEGORIA_CANAL_TEMPORARIO,
      permissionOverwrites: [
        {
          id: newState.guild.id,
          deny: ['MANAGE_CHANNELS'],
        },
        {
          id: newState.member.user.id,
          allow: ['MANAGE_CHANNELS'],
        }
      ],
    };

    try {
      const newChannel = await newState.guild.channels.create(channelName, channelOptions);
      console.log(`Canal criado: ${newChannel.name}`);
      canaisTemporarios.add(newChannel.id);
      criadoresDeCanais.set(newChannel.id, newState.member.user.id);
      salvarDados();
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
      canaisTemporarios.delete(channel.id);
      criadoresDeCanais.delete(channel.id);
      salvarDados();
    }
  }
});

client.on('messageCreate', async message => {
  // Verifique se a mensagem é um comando para mudar o nome do canal
  if (message.content.startsWith('!mudarnome')) {
    const memberVoiceChannel = message.member.voice.channel;
    if (!memberVoiceChannel) {
      return message.reply('Você precisa estar em um canal de voz para usar este comando.').then(msg => {
        setTimeout(() => msg.delete(), 5000);
      });
    }

    if (!canaisTemporarios.has(memberVoiceChannel.id)) {
      return message.reply('Este comando só pode ser usado em canais de voz temporários.').then(msg => {
        setTimeout(() => msg.delete(), 5000);
      });
    }

    if (criadoresDeCanais.get(memberVoiceChannel.id) !== message.author.id) {
      return message.reply('Você não é o proprietário deste canal de voz temporário.').then(msg => {
        setTimeout(() => msg.delete(), 5000);
      });
    }

    const novoNome = message.content.split(' ').slice(1).join(' ');
    if (!novoNome) {
      return message.reply('Por favor, especifique um novo nome para o canal.').then(msg => {
        setTimeout(() => msg.delete(), 5000);
      });
    }

    try {
      await memberVoiceChannel.setName(novoNome);
      const reply = await message.reply(`O canal foi renomeado para: ${novoNome}`);
      setTimeout(() => reply.delete(), 5000);
    } catch (error) {
      console.error('Erro ao renomear o canal:', error);
      message.reply('Ocorreu um erro ao tentar renomear o canal.').then(msg => {
        setTimeout(() => msg.delete(), 5000);
      });
    }

    // Deletar a mensagem de comando do usuário após verificar as condições
    message.delete().catch(console.error);
  }
});

const SetMaxMembers = require('./commands/SetMaxMembers');
const { createPrivacySelectMenu } = require('./commands/createPrivacySelectMenu');

client.on('interactionCreate', async (interaction) => {
  const memberVoiceChannel = interaction.member.voice.channel;

  if (interaction.isButton()) {
    if (interaction.customId === 'cname') {
      if (!memberVoiceChannel || !canaisTemporarios.has(memberVoiceChannel.id) || criadoresDeCanais.get(memberVoiceChannel.id) !== interaction.user.id) {
        return interaction.reply({ content: 'Você não tem permissão para editar este canal ou não está em um canal de voz temporário.', ephemeral: true });
      }

      const modal = new Modal()
        .setCustomId('renameModal')
        .setTitle('Renomear Canal de Voz')
        .addComponents([
          new MessageActionRow().addComponents(
            new TextInputComponent()
              .setCustomId('newChannelName')
              .setLabel('Novo nome para o canal de voz')
              .setStyle('SHORT')
              .setPlaceholder(':Porvalope:')
              .setRequired(true),
          ),
        ]);

      await interaction.showModal(modal);
    } else if (interaction.customId === SetMaxMembers.getCustomId()) {
      if (!memberVoiceChannel || !canaisTemporarios.has(memberVoiceChannel.id) || criadoresDeCanais.get(memberVoiceChannel.id) !== interaction.user.id) {
        return interaction.reply({ content: 'Você não tem permissão para editar este canal ou não está em um canal de voz temporário.', ephemeral: true });
      }

      await interaction.showModal(SetMaxMembers.createModal());

    } else if (interaction.customId === 'privacyOptions') {
      if (!memberVoiceChannel || !canaisTemporarios.has(memberVoiceChannel.id) || criadoresDeCanais.get(memberVoiceChannel.id) !== interaction.user.id) {
        return interaction.reply({ content: 'Você não tem permissão para editar este canal ou não está em um canal de voz temporário.', ephemeral: true });
      }
      const privacyMenu = createPrivacySelectMenu();
      await interaction.reply({ content: 'Selecione uma opção de privacidade:', components: [privacyMenu], ephemeral: true });
    }
  }

  if (interaction.isSelectMenu() && interaction.customId === 'privacySelect') {
    // Pega a opção selecionada pelo usuário e aplica a lógica correspondente
    const selectedOption = interaction.values[0];
    switch (selectedOption) {
      case 'lock':
        // Negar a permissão de conectar para todos os membros
        await memberVoiceChannel.permissionOverwrites.set([
          {
            id: interaction.guild.roles.everyone.id,
            deny: ['CONNECT']
          },
          {
            id: interaction.member.id, // Garante que o membro que trancou o canal ainda possa se conectar
            allow: ['CONNECT']
          }
        ]);
        // Responder ao usuário que o canal foi trancado
        await interaction.update({
          content: 'O canal foi trancado. Ninguém mais pode entrar.',
          components: [],
          ephemeral: true
        });
        break;
      case 'unlock':
          // Permitir a permissão de conectar para todos os membros
          await memberVoiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, { CONNECT: null });
          await interaction.update({
            content: 'O canal foi desbloqueado. Todos os usuários podem entrar agora.',
            components: [],
            ephemeral: true
          });
        break;
      case 'invisible':
          // Definir o canal para ser visível apenas pelo proprietário ou por um cargo confiável
          await memberVoiceChannel.permissionOverwrites.set([
            {
              id: interaction.guild.roles.everyone.id,
              deny: ['VIEW_CHANNEL']
            },
            {
              id: interaction.member.id,
              allow: ['VIEW_CHANNEL', 'CONNECT']
            }
            // Se você tiver um cargo confiável que também deve ver o canal, adicione outra sobrescrita aqui
          ]);
          await interaction.update({
            content: 'O canal agora está invisível para os outros usuários.',
            components: [],
            ephemeral: true
          });
        break;
      case 'visible':
          // Remover permissões específicas e voltar ao padrão do servidor
          await memberVoiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, { VIEW_CHANNEL: null });
          await interaction.update({
            content: 'O canal agora está visível para todos os usuários.',
            components: [],
            ephemeral: true
          }); 
        break;
      case 'closeChat':
        const canaisData = lerDadosCanais();
        const canalInfo = canaisData.find(canal => canal.idchannel === memberVoiceChannel.id);
      
        if (!canalInfo || canalInfo.ownerChannel !== interaction.user.id) {
          await interaction.update({
            content: 'Você não é o proprietário deste canal de voz.',
            components: [],
            ephemeral: true
          });
          break;
        }
      
        const textChannel = memberVoiceChannel.guild.channels.cache.get(canalInfo.idchannel);
      
        if (textChannel) {
          await textChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SEND_MESSAGES: false });
          await interaction.update({
            content: 'O bate-papo foi fechado.',
            components: [],
            ephemeral: true
          });
        } else {
          await interaction.update({
            content: 'Não foi possível encontrar um canal de texto vinculado.',
            components: [],
            ephemeral: true
          });
        }
        break;
      case 'openChat':
          const canaisData2 = lerDadosCanais();
          const canalInfo2 = canaisData2.find(canal => canal.idchannel === memberVoiceChannel.id);
        
          if (!canalInfo2) {
            await interaction.update({
              content: 'Não foi possível encontrar um canal de texto vinculado.',
              components: [],
              ephemeral: true
            });
            break;
          }
        
          const textChannel2 = memberVoiceChannel.guild.channels.cache.get(canalInfo2.idchannel);
        
          if (textChannel2) {
            await textChannel2.permissionOverwrites.edit(interaction.guild.roles.everyone, { SEND_MESSAGES: null });
            await interaction.update({
              content: 'O bate-papo foi aberto. Todos os usuários podem enviar mensagens agora.',
              components: [],
              ephemeral: true
            });
          } else {
            await interaction.update({
              content: 'Não foi possível encontrar um canal de texto vinculado.',
              components: [],
              ephemeral: true
            });
          }
          break;
                
      default:
        await interaction.reply({ content: 'Opção de privacidade não reconhecida.', ephemeral: true });

        // Confirma a ação para o usuário de forma efêmera
        await interaction.update({ content: `A opção '${selectedOption}' foi aplicada com sucesso.`, components: [], ephemeral: true });
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'renameModal') {
      const newChannelName = interaction.fields.getTextInputValue('newChannelName');
      const memberVoiceChannel = interaction.member.voice.channel;

      if (!memberVoiceChannel || !canaisTemporarios.has(memberVoiceChannel.id) || criadoresDeCanais.get(memberVoiceChannel.id) !== interaction.user.id) {
        return interaction.reply({ content: 'Você não tem permissão para editar este canal ou não está em um canal de voz temporário.', ephemeral: true });
      }

      try {
        await memberVoiceChannel.setName(newChannelName);
        await interaction.reply({ content: `O canal foi renomeado para: ${newChannelName}`, ephemeral: true });
      } catch (error) {
        console.error('Erro ao renomear o canal:', error);
        await interaction.reply({ content: 'Houve um erro ao tentar renomear o canal.', ephemeral: true });
      }
    } else if (interaction.customId === SetMaxMembers.getCustomId()) {
      const maxMembers = interaction.fields.getTextInputValue('maxMembers');
      const memberVoiceChannel = interaction.member.voice.channel;

      if (!memberVoiceChannel) {
        return interaction.reply({ content: 'Você precisa estar em um canal de voz para usar este comando.', ephemeral: true });
      }

      if (!canaisTemporarios.has(memberVoiceChannel.id)) {
        return interaction.reply({ content: 'Este comando só pode ser usado em canais de voz temporários.', ephemeral: true });
      }

      if (criadoresDeCanais.get(memberVoiceChannel.id) !== interaction.user.id) {
        return interaction.reply({ content: 'Você não é o proprietário deste canal de voz temporário.', ephemeral: true });
      }

      try {
        const userLimit = parseInt(maxMembers, 10);
        if (isNaN(userLimit) || userLimit < 0) {
          return interaction.reply({ content: 'Por favor, forneça um número válido.', ephemeral: true });
        }

        await memberVoiceChannel.setUserLimit(userLimit);
        await interaction.reply({ content: `O limite máximo de membros foi definido para: ${userLimit}`, ephemeral: true });
      } catch (error) {
        console.error('Erro ao definir o limite de membros:', error);
        await interaction.reply({ content: 'Houve um erro ao tentar definir o limite de membros.', ephemeral: true });
      }
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
