import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	Interaction,
	ModalBuilder,
	TextChannel,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';
import { createChannelCreateOptions, createLogEmbed, createUserEmbed, getUserChannel } from '../commands/ticket.js';

export const name = 'interactionCreate';
export const once = false;
export async function execute(interaction: Interaction) {
	if (interaction.isCommand()) {
		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) return;

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
	if (interaction.isButton()) {
		switch (interaction.customId) {
			case 'vindertech':
				const modal = new ModalBuilder().setCustomId('vindertech').setTitle('Richiesta Supporto');

				// Create the text input components
				const descriptionInput = new TextInputBuilder()
					.setCustomId('description')
					.setLabel('descrizione del problema')
					.setStyle(TextInputStyle.Paragraph);

				const platformInput = new TextInputBuilder()
					.setCustomId('platform')
					.setLabel('Piattaforma')
					.setStyle(TextInputStyle.Short)
					.setPlaceholder('PC, XBOX, PS, Mobile, Switch')
					.setMaxLength(10);

				const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);
				const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(platformInput);

				// Add inputs to the modal
				modal.addComponents(firstActionRow, secondActionRow);

				// Show the modal to the user
				return await interaction.showModal(modal);
			case 'ticket-open':
				const richiesteUtentiChannel = (await interaction.client.channels.fetch(
					'683363814137266207'
				)) as TextChannel;
				let richiestaUtenteMessage;
				try {
					richiestaUtenteMessage = await richiesteUtentiChannel.messages.fetch(
						interaction.message?.embeds[0]?.description?.split('(')[1].split(')')[0].split('/').at(-1)!
					);
				} catch {
					return await interaction.reply({
						content: '<:FNIT_Stop:857617083185758208> **Message not found**',
						ephemeral: true,
					});
				}
				const user = await interaction.guild?.members.fetch(
					richiestaUtenteMessage.embeds[0].description?.split('<@')[1].split('>')[0]!
				);
				if (!user)
					return await interaction.reply({
						content: '<:FNIT_Stop:857617083185758208> **User not found**',
						ephemeral: true,
					});
				let userEmbed = createUserEmbed(interaction, user.user, 'open');
				let logEmbed = createLogEmbed(interaction, user.user, 'open');
				if (getUserChannel(interaction.guild!, user.id).size === 0) {
					const ticketChannel = await interaction.guild?.channels.create(
						createChannelCreateOptions(interaction, user.user)
					);
					ticketChannel?.send({ embeds: [userEmbed] });
					const logChannel = (await interaction.client.channels.fetch('721809334178414614')) as TextChannel;
					await logChannel.send({ embeds: [logEmbed] });
					await interaction.update({
						embeds: [
							new EmbedBuilder({
								description:
									'[`Richiesta presa in carico da ' +
									interaction.user.tag +
									'`](' +
									richiestaUtenteMessage.url +
									')',
								color: 0x00e3ff,
							}),
						],
						components: [],
					});
					return await interaction.reply({
						content: `**Ticket aperto per <@${user.id}> (` + '`' + user.id + '`)**',
						ephemeral: true,
					});
				} else {
					return await interaction.reply({
						content: `L'utente <@${user.id}> (` + '`' + user.id + '`) ha gi?? un ticket aperto.',
						ephemeral: true,
					});
				}
		}
	}

	if (interaction.isModalSubmit()) {
		switch (interaction.customId) {
			case 'vindertech':
				let description = interaction.fields.getTextInputValue('description');
				let platform = interaction.fields.getTextInputValue('platform');
				if (!['pc', 'switch', 'ps', 'xbox', 'mobile'].includes(platform.toLowerCase()))
					return interaction.reply({
						content: '**<:FNIT_Stop:857617083185758208> Piattaforma non valida**',
						ephemeral: true,
					});

				const richiesteUtentiChannel = (await interaction.client.channels.fetch(
					'683363814137266207'
				)) as TextChannel;
				let richesteUtentiMessage = await richiesteUtentiChannel.send({
					embeds: [
						new EmbedBuilder()
							.setColor('#00e3ff')
							.setTitle('Nuova Richiesta di Supporto')
							.setDescription(
								`Ehi <@${interaction.user.id}>, la tua richiesta ?? in lavorazione!\n\nPer favore, **abbi pazienza**: appena un membro dello staff sar?? disponibile, arriver?? in tuo aiuto. Sii paziente!\n**Descrizione**\n` +
									'```\n' +
									description +
									'\n```\n**Piattaforma**' +
									'```' +
									platform +
									'\n```\n'
							),
					],
				});
				const nuoveRichiesteChannel = (await interaction.client.channels.fetch(
					'807985160703180850'
				)) as TextChannel;
				nuoveRichiesteChannel.send({
					embeds: [
						new EmbedBuilder({
							description: '[`Nuova richiesta di supporto per voi`](' + richesteUtentiMessage.url + ')',
							footer: { text: 'Interagisci con il bottone per aprire la richiesta' },
							color: 0x00e3ff,
						}),
					],
					components: [
						new ActionRowBuilder<ButtonBuilder>().addComponents(
							new ButtonBuilder()
								.setLabel('Apri Ticket')
								.setStyle(ButtonStyle.Success)
								.setCustomId('ticket-open')
						),
					],
				});
				return await interaction.reply({
					content:
						'<:FNIT_ThumbsUp:454640434380013599> Richiesta inviata!\nPer favore, **abbi pazienza**: appena un membro dello staff sar?? disponibile, arriver?? in tuo aiuto.',
					ephemeral: true,
				});
		}
	}
}
