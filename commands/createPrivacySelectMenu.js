const { MessageActionRow, MessageSelectMenu } = require('discord.js');

function createPrivacySelectMenu() {
  const row = new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId('privacySelect')
      .setPlaceholder('Escolha uma opção de privacidade')
      .addOptions([
        {
          label: 'Trancar',
          description: 'Somente usuários confiáveis poderão entrar no seu canal de voz',
          value: 'lock',
          emoji: '<:lockIcon:1190351996507656222>'
        },
        {
          label: 'Desbloquear',
          description: 'Todos poderão entrar no seu canal de voz',
          value: 'unlock',
          emoji: '<:unlockIcon:1190352073317957652>'
        },
        {
          label: 'Invisível',
          description: 'Somente usuários confiáveis poderão visualizar seu canal de voz',
          value: 'invisible',
          emoji: '<:invisibleIcon:1190352143840972810>'
        },
        {
          label: 'Visível',
          description: 'Todos poderão ver seu canal de voz',
          value: 'visible',
          emoji: '<:visibleIcon:1190352308052176926>'
        },
        {
          label: 'Fechar bate-papo',
          description: 'Somente usuários confiáveis poderão enviar mensagens de texto no seu bate-papo',
          value: 'closeChat',
          emoji: '<:blockChatIcon:1190352391602708520>'
        },
        {
          label: 'Abrir bate-papo',
          description: 'Todos poderão enviar mensagens de texto no seu bate-papo',
          value: 'openChat',
          emoji: '<:unblockChatIcon:1190352460334764093>'
        },
      ])
  );

  return row;
}
exports.createPrivacySelectMenu = createPrivacySelectMenu;
