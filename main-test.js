require('dotenv').config();
const {
    Client,
    Intents,
    MessageActionRow,
    MessageButton,
    Modal,
    TextInputComponent,
  } = require('discord.js');
  
  const TOKEN = process.env.DISCORD_BOT_TOKEN;
  const client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES],
  });
  
  client.on('messageCreate', (message) => {
    if (message.author.bot) return;
  
    let button = new MessageActionRow();
    button.addComponents(
      new MessageButton()
        .setCustomId('verification-button')
        .setStyle('PRIMARY')
        .setLabel('Open modal dialog'),
    );
    message.reply({
      components: [button],
    });
  });
  
  client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
      if (interaction.customId === 'verification-button') {
        const modal = new Modal()
          .setCustomId('verification-modal')
          .setTitle('Verify yourself')
          .addComponents([
            new MessageActionRow().addComponents(
              new TextInputComponent()
                .setCustomId('verification-input')
                .setLabel('Answer')
                .setStyle('SHORT')
                .setMinLength(4)
                .setMaxLength(12)
                .setPlaceholder('ABCDEF')
                .setRequired(true),
            ),
          ]);
  
        await interaction.showModal(modal);
      }
    }
  
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'verification-modal') {
        const response =
          interaction.fields.getTextInputValue('verification-input');
        interaction.reply(`Yay, your answer is submitted: "${response}"`);
      }
    }
  });
  
  client.once('ready', () => {
    console.log('Bot v13 is connected...');
  });
  
  client.login(TOKEN);