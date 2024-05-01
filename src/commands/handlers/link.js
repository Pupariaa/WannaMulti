const dotenv = require('dotenv');
const { Client, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Sequelize = require('sequelize');
dotenv.config({ path: '../../../config.js' });
const { osuLink } = require('../../../models/Events');
const { UsernameExists } = require('../../../functions');

const userIntervals = {};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Link ton compte osu! à WannaMulti')
        .addStringOption(option =>
            option.setName('pseudo')
                .setDescription('Obligatoire')
                .setRequired(true)),

    async execute(interaction) {
        const pseudo_osu = interaction.options.getString('pseudo');
        const userId = interaction.user.id;

        if (userIntervals[userId]) {
            await osuLink.destroy({
                where: {
                    discord_id: userId 
                }
            });

            clearInterval(userIntervals[userId]);
            delete userIntervals[userId];
        }

        let osuId = await UsernameExists(pseudo_osu);
        let embed = new EmbedBuilder()
            .setTitle(`Link Osu!`)
            .setColor('#0099ff')
            .setDescription(`Patiente un petit moment.. Je génère un lien !`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], fetchReply: true });

        if (osuId) {
            const result = await osuLink.findOne({
                where: {
                    discord_id: userId
                }
            });

            if (result) {
                if (result.wait === "1") {
                    userIntervals[userId] = setInterval(async () => {
                        const updatedResult = await osuLink.findOne({
                            where: {
                                discord_id: userId
                            }
                        });

                        if (updatedResult && updatedResult.wait !== "1") {
                            embed = new EmbedBuilder()
                                .setColor(0x00ff00)
                                .setTitle('Link Osu!')
                                .setDescription(`Merci, ${pseudo_osu}! Ton compte a été lié avec succès.`)
                                .setTimestamp();
                            await interaction.editReply({ embeds: [embed] });
                            clearInterval(userIntervals[userId]);
                            delete userIntervals[userId];
                        }
                    }, 300);
                } else {
                    embed = new EmbedBuilder()
                        .setColor(0x00ff00)
                        .setTitle('Link Osu!')
                        .setDescription(`Ah! Mon petit doigt me dit que tu as déjà linké ton compte ! Si tu penses que c'est une erreur, contacte dracoshiba`)
                        .setTimestamp();
                    await interaction.editReply({ embeds: [embed] });
                }
            } else {
                embed = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('Link Osu!')
                    .setDescription(`Connecte-toi à WannaMulti sur Osu! \n https://osu.ppy.sh/oauth/authorize?client_id=31851&redirect_uri=https://techalchemy.fr/oAuth2/WannaMulti/index.php&response_type=code&scope=public%20identify`)
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });

                await osuLink.create({
                    discord_id: userId,
                    osu_username: pseudo_osu,
                    osu_id: osuId,
                    date: new Date().toString(),
                    wait: true
                });

                userIntervals[userId] = setInterval(async () => {
                    const checkResult = await osuLink.findOne({
                        where: {
                            discord_id: userId
                        }
                    });

                    if (checkResult && checkResult.wait !== "1") {
                        embed = new EmbedBuilder()
                            .setColor(0x00ff00)
                            .setTitle('Link Osu!')
                            .setDescription(`Merci, ${pseudo_osu}! Ton compte a été lié avec succès.`)
                            .setTimestamp();
                        await interaction.editReply({ embeds: [embed] });
                        clearInterval(userIntervals[userId]);
                        delete userIntervals[userId];
                    }
                }, 300);
            }
        } else {
            embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('Link Osu!')
                .setDescription(`Ton pseudo Osu! m'est inconnu..`)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
    }
};
