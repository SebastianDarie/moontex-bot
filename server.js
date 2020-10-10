require('dotenv').config()

const { Client, MessageEmbed } = require('discord.js')
const client = new Client({
  partials: ['MESSAGE', 'USER'],
})

const keys = [
  { name: '1111-2222-3333-4444', taken: false },
  { name: '2772', taken: true },
  { name: '1111', taken: false },
]

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`)
})

client.on('guildMemberAdd', async (member) => {
  const embed = new MessageEmbed()
    .setColor('#46b7f5')
    .setAuthor('MoontexIO')
    .setTitle('Welcome to the server!')
    .setDescription(
      'MoontexIO is a community to help you secure limited items and make a living out of it!'
    )
    .addField('Username', member.user.username)
    .addField('User ID', member.id)
    .addField('Join Date', member.joinedAt.toLocaleString())
    .addField('Verification', 'Do you have a license key?')
    .setFooter('Moontex LLC © 2020')

  const msg = await member.send(embed)
  await msg.react('✅')
  await msg.react('❌')
})

client.on('messageReactionAdd', async (reaction, user) => {
  const { message, emoji } = reaction

  const embed = message.embeds[0]
  const { value } = embed.fields.find((field) => field.name === 'User ID')
  let memberToApprove

  value
    ? (memberToApprove = await user.client.guilds.cache
        .get(process.env.GUILD_ID)
        .members.cache.get(value))
    : console.log('id not found')

  switch (emoji.name) {
    case '✅':
      if (validateRole(memberToApprove) && !user.bot) {
        const filter = (m) => m.author.id === memberToApprove.id
        const newMsg = await memberToApprove.send(
          'Please provide the key so I can validate it'
        )
        const response = await newMsg.channel.awaitMessages(filter, {
          time: 10000,
        })

        const resKey = response.map((key) => key.content)
        const verifyKey = keys.find((key) => key.name === resKey[0])

        if (!verifyKey) {
          await memberToApprove.send('The key you provided does not exist!')
        } else if (verifyKey.taken === true) {
          await memberToApprove.send('Key already validated u little bitch!')
        } else {
          await memberToApprove.roles.add(process.env.MEMBER_ROLE)
          await memberToApprove.send('You were successfully approved!')
        }
      }

      break

    case '❌':
      if (validateRole(memberToApprove) && !user.bot) {
        await memberToApprove.send('Please buy a license key first!')
      }

      break
  }
})

const validateRole = (member) => {
  if (member.roles.cache.has(process.env.MEMBER_ROLE)) return false
  return true
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

client.login(process.env.BOT_TOKEN)
