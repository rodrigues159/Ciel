const { Modal, TextInputComponent, MessageActionRow } = require('discord.js');

class SetMaxMembers {
    static getCustomId() {
        return 'setMaxMembers';
    }

    static createModal() {
        const modal = new Modal()
            .setCustomId(SetMaxMembers.getCustomId())
            .setTitle('Definir Máximo de Membros');

        const maxMembersInput = new TextInputComponent()
            .setCustomId('maxMembers')
            .setLabel('Número máximo de membros  (0 = ilimitado)')
            .setStyle('SHORT')
            .setMinLength(1)
            .setMaxLength(2)
            .setRequired(true);

        const actionRow = new MessageActionRow().addComponents(maxMembersInput);
        modal.addComponents(actionRow);

        return modal;
    }
}

module.exports = SetMaxMembers;
