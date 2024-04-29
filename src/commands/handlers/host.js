const dotenv = require('dotenv');
const { Client, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, User } = require('discord.js');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
dotenv.config({ path: '../../../config.js' });
const { events } = require('../../../models/Events')
const { UsernameExists } = require('../../../functions')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('host')
        .setDescription('Créer une partie')
        .addStringOption(option =>
            option.setName('nom')
                .setDescription('Obligatoire')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('pseudo_osu')
                .setDescription('Obligatoire')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('date')
                .setDescription('Obligatoire (format JJ-MM-AAAA)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('heure')
                .setDescription('Obligatoire (format HH:MM)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Choisissez un mode de jeu')
                .setRequired(true)
                .addChoices(
                    { name: 'STD', value: 'STD' },
                    { name: 'MANIA', value: 'MANIA' },
                    { name: 'CTB', value: 'CTB' },
                    { name: 'TAIKO', value: 'TAIKO' })),

    async execute(interaction) {
        const gamename = interaction.options.getString('nom');
        const date = interaction.options.getString('date');
        const heure = interaction.options.getString('heure');
        const pseudo_osu = interaction.options.getString('pseudo_osu');
        const gamemode = interaction.options.getString('mode');
        const discordUserId = interaction.user.id;
        let isGood = true;
        const randomId = Math.floor(100000 + Math.random() * 900000);
        if (!gamename.match(/^[a-zA-Z0-9 ]{1,50}$/)) {
            return interaction.reply({ content: 'Le nom de la partie doit être alphanumérique et jusqu\'à 50 caractères.', ephemeral: true });
        }
        if (pseudo_osu.length > 16) {
            return interaction.reply({ content: 'Le pseudo osu doit avoir 16 caractères ou moins.', ephemeral: true });
        }
        if (!date.match(/^\d{2}-\d{2}-\d{4}$/)) {
            return interaction.reply({ content: 'La date doit être au format JJ-MM-AAAA.', ephemeral: true });
        }
        if (!heure.match(/^\d{2}:\d{2}$/)) {
            return interaction.reply({ content: 'L\'heure doit être au format HH:MM.', ephemeral: true });
        }

        const dateParts = date.split('-');
        const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${heure}:00`;
        const startTime = new Date(formattedDate);
        const endTime = new Date(startTime.getTime() + 90 * 60000);
        const currentDate = new Date();

        if (startTime.toString() === 'Invalid Date') {
            return interaction.reply({ content: 'Cette date n\'existe pas !', ephemeral: true });
        }

        if (startTime < currentDate) {
            return interaction.reply({ content: 'Tu ne peux pas créer un multi à une date passée.', ephemeral: true });
        }

        if (!await UsernameExists(pseudo_osu)) {
            return interaction.reply({ content: 'Ton pseudo n\'est pas valide.', ephemeral: true });
        }
        try {
            events.count({
                where: {
                    date_ts: {
                        [Op.between]: [startTime.getTime(), endTime.getTime()]
                    }
                }
            }).then(async (count) => {
                if (count >= 4) {
                    isGood = false
                    try {
                        return interaction.reply({ content: 'Il y a déjà 4 Mutli planifiés dans cette plage horaire. Choisis choisir un autre horaire.', ephemeral: true });
                    } catch (e) {
                        return console.log(e)
                    }
                } else {
                    const dateParts = date.split('-');
                    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${heure}:00`;
                    const date_ts = new Date(formattedDate).getTime();

                    if (isGood) {
                        const embed = new EmbedBuilder()
                            .setTitle(`Partie ${gamename}#${randomId} planifiée`)
                            .setColor('#0099ff')
                            .setDescription(`Ta partie "${gamename}" a bien été planifiée et se tiendra le ${date} à ${heure}.`)
                            .setTimestamp();
                        try {
                            await interaction.guild.roles.create({
                                name: `Multi ${randomId}`,
                                color: '#0099ff',
                                reason: 'Nouveau rôle pour un événement spécifique'
                            });
                        } catch (error) {
                            console.error('Erreur lors de la création du rôle:', error);
                        }
                        try {
                            const channel = interaction.guild.channels.cache.get(process.env.party_announcements_channel);
                            await interaction.reply({ embeds: [embed], content: 'Plannification en cours de traitement...', ephemeral: true });
                            const embedEvent = new EmbedBuilder()
                                .setColor('#0099ff')
                                .setTitle(`Partie ${gamemode} "${gamename}" le ${date} à ${heure}`)
                                .setDescription('Clique sur Participer ou Ne pas participer.')
                                .addFields({
                                    name: "Participants",
                                    value: `0/16`,
                                    inline: true
                                })
                                .setTimestamp()
                                .setFooter({ text: `ID:${randomId}` });
                            const row = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('participer')
                                        .setLabel('Participer')
                                        .setStyle(ButtonStyle.Success),
                                    new ButtonBuilder()
                                        .setCustomId('ne_pas_participer')
                                        .setLabel('Ne pas participer')
                                        .setStyle(ButtonStyle.Danger)
                                );
                            const messageEvent = await channel.send({ embeds: [embedEvent], components: [row] });
                            const collectorFilter = (t) => {
                                const isButton = t.isButton();
                                const customId = t.customId;
                                return isButton && customId;
                            };
                            const collector = channel.createMessageComponentCollector({ filter: collectorFilter });
                            collector.on('collect', async i => {
                                const roleName = `Multi ${randomId}`;
                                const role = i.guild.roles.cache.find(r => r.name === roleName);
                                if (!role) {
                                    console.error("Rôle non trouvé");
                                    return;
                                }
                                const member = await i.guild.members.fetch(i.user.id);
                                if (i.customId === 'participer') {
                                    await i.deferUpdate();
                                    const event = await events.findOne({ where: { hours: messageEvent.id } });
                                    if (member.roles.cache.has(role.id)) {
                                        await i.followUp({ content: 'Tu participes déjà à cette partie.', ephemeral: true });
                                    } else {

                                        if (event.participants >= 16) {
                                            await i.followUp({ content: 'Désolé, cette partie est déjà pleine.', ephemeral: true });
                                            return;
                                        } else {
                                            await member.roles.add(role);
                                            event.participants += 1;
                                            await event.save();
                                            embedEvent.setFields({
                                                name: "Participants",
                                                value: `${event.participants}/16`,
                                                inline: false
                                            });
                                            await messageEvent.edit({ embeds: [embedEvent] });
                                            await i.followUp({ content: 'Tu as été ajouté à la partie.\nTu sera notifié 10 min à l\'avance.', ephemeral: true });
                                        }
                                    }
                                } else if (i.customId === 'ne_pas_participer') {
                                    const event = await events.findOne({ where: { hours: messageEvent.id } });
                                    await i.deferUpdate();
                                    if (!member.roles.cache.has(role.id)) {
                                        await i.followUp({ content: 'Tu ne participe déjà pas à cette partie.', ephemeral: true });
                                    } else {
                                        await member.roles.remove(role);
                                        event.participants -= 1;
                                        await event.save();
                                        embedEvent.setFields({
                                            name: "Participants",
                                            value: `${event.participants}/16`,
                                            inline: false
                                        });
                                        await messageEvent.edit({ embeds: [embedEvent] });
                                        await i.followUp({ content: 'Tu ne participes plus à cette partie.', ephemeral: true });
                                    }
                                }
                            });
                            const gmmode = gamemode === "STD" ? "Standard" : gamemode === "MANIA" ? "Mania" : gamemode === "CTB" ? "Catch the Beat" : gamemode === "TAIKO" ? "Taiko" : null
                            await events.create({
                                player_name: pseudo_osu,
                                tags: '',
                                discord_userid: discordUserId,
                                date_ts: date_ts,
                                hours: messageEvent.id,
                                gamemode: gmmode,
                                gamename: gamename,
                                rolename: `Multi ${randomId}`,
                                participants: 0
                            });


                        } catch (e) {
                            console.log(e);
                            await interaction.followUp({ content: 'Erreur lors de l\'envoi de la réponse.', ephemeral: true });
                        }
                        try {
                            const channelManage = interaction.guild.channels.cache.get(process.env.manage_party_channel);
                            const EmbedManage = new EmbedBuilder()
                                .setColor('#0099ff')
                                .setTitle(`Partie ${gamemode} "${gamename}" le ${date} à ${heure}`)
                                .setDescription('Actions à effectuer')
                                .setTimestamp()
                                .setFooter({ text: `ID:${randomId}` });

                            const row2 = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('remove')
                                        .setLabel('Supprimer')
                                        .setStyle(ButtonStyle.Success),
                                    new ButtonBuilder()
                                        .setCustomId('viewlist')
                                        .setLabel('Voir les participants')
                                        .setStyle(ButtonStyle.Success)
                                );
                            const messageManage = await channelManage.send({ embeds: [EmbedManage], components: [row2] });
                            const collectorFilter2 = (m) => {
                                const isButton = m.isButton();
                                const customId = m.customId;
                                return isButton && customId;
                            };
                            const collector2 = channelManage.createMessageComponentCollector({ filter: collectorFilter2 });
                            collector2.on('collect', async i => {
                                if (i.customId === 'participer') {

                                } else if (i.customId === 'ne_pas_participer') {

                                }
                            });

                        } catch (e) {
                            console.log(e)
                            await interaction.followUp({ content: 'Erreur lors de l\'envoi de la réponse.', ephemeral: true });
                        }
                    }
                }
            }).catch(err => {
                console.error('Erreur lors de la vérification des événements:', err);
                isGood = false
                return interaction.reply({ content: 'Erreur lors de la vérification des disponibilités.', ephemeral: true });

            });
        } catch (e) {
            console.log(e);
            isGood = true
            return interaction.reply({ content: 'Format de date ou d\'heure invalide.', ephemeral: true });

        }

    }
};
