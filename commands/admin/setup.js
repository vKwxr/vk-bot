const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configura opciones del bot para este servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName("tickets")
        .setDescription("Configura el sistema de tickets")
        .addChannelOption(option =>
          option.setName("categoria").setDescription("Categoría donde se crearán los tickets").setRequired(true)
        )
        .addRoleOption(option =>
          option.setName("staff").setDescription("Rol del staff que podrá ver los tickets").setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (subcommand === "tickets") {
      const category = interaction.options.getChannel("categoria");
      const staffRole = interaction.options.getRole("staff");

      if (category.type !== 4) {
        return interaction.reply({ content: "❌ El canal debe ser una categoría.", ephemeral: true });
      }

      const db = new sqlite3.Database(path.join(__dirname, "../../tickets.sqlite"));

      db.run(
        `INSERT INTO ticket_configs (guild_id, staff_role_id, category_id)
         VALUES (?, ?, ?)
         ON CONFLICT(guild_id) DO UPDATE SET staff_role_id = excluded.staff_role_id, category_id = excluded.category_id;`,
        [guildId, staffRole.id, category.id],
        function (err) {
          if (err) {
            console.error("Error al guardar configuración:", err);
            return interaction.reply({ content: "❌ Error al guardar configuración.", ephemeral: true });
          }

          interaction.reply({
            content: "✅ Configuración de tickets guardada correctamente.",
            ephemeral: true,
          });
        }
      );
    }
  },
};
