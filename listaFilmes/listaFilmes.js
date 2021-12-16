const env = require('../.env')
const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const moment = require('moment')
const Session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const { enter, leave } = Stage
const bot = new Telegraf(env.token)

let lista = []

bot.hears('📽️', ctx => {
    ctx.reply('Hora do Filme!! ')
})

bot.hears(/popcorn/i, ctx => {
    ctx.reply('Pipoca 🍿🍿🍿🍿')
    ctx.reply(`Qual você prefere?`,
        Markup.keyboard(['🍫 Com chocolate','🧈 Com Manteiga','🍿 Natural']).resize().oneTime().extra())
})

bot.hears('🍫 Com chocolate', ctx => {
    ctx.reply('Realmente é muito boa!')
})

bot.hears('🧈 Com Manteiga', ctx => {
    ctx.reply('Legal! Também gosto dessa!')
})

bot.hears('🍿 Natural', ctx => {
    ctx.reply('Também é a minha predileta')
})

bot.hears(/(\d{2}\/\d{2}\/\d{4})/g, ctx => {
    moment.locale('pt-BR')
    const data = moment(ctx.match[1], 'DD/MM/YYYY')
    ctx.reply(`${ctx.match[1]} cai em ${data.format('dddd')}`)
})

// iniciando o bot
bot.start(ctx => {
    const from = ctx.update.message.from
    if (from.id != '1351450134' && from.id != '2078451821') {
        ctx.reply(`Desculpe ${from.first_name} ${from.last_name}, você não tem permissão para falar comigo!`)
    }
    else {

    // tratando eventos de recebimento de localização
    bot.on('location', ctx => {
        const loc = ctx.update.message.location
        console.log(loc)
        ctx.reply(`Entendido! Você está em: 
            Latitude: ${loc.latitude}, 
            Longitude: ${loc.longitude}`)    
    })

    // tratando o evento de recebimento de contato
    bot.on('contact', ctx => {
        const cont = ctx.update.message.contact
        console.log(cont)
        ctx.reply(`Legal! O telefone do ${cont.first_name} é ${cont.phone_number}`)

    })

    // tratando o evento para recebimento de aúdio
    bot.on('voice', ctx => {
        const voz = ctx.update.message.voice
        console.log(voz)
        ctx.reply(`Áudio de ${voz.duration} segundos recebido!`)
    })

    // tratando o evento para recebimento de imagem/foto
    // verificar o erro de inserir uma imagem (??) a mais
    bot.on('photo', ctx => {
        const foto = ctx.update.message.photo
        console.log(foto)
        console.log(foto.length)
        // criando um laço para varrer todas as possíveis fotos enviadas
        foto.forEach((ph, i) => {
            ctx.reply(`A ${i}a foto tem resolução de: ${ph.width} X ${ph.height} pixels`)        
        })
    })

    // tratando o evento para recebimento de 'stickers'
    bot.on('sticker', ctx => {
        const stic = ctx.update.message.sticker
        console.log(stic)
        ctx.reply(`Você enviou o ${stic.emoji} do conjunto ${stic.set_name}`) 
    })

    bot.command('help', ctx => ctx.reply(`Acredite! Estou mais perdido que você... 😞`));
    bot.command('respostas', ctx => {
    ctx.replyWithHTML(`Resposta com <b>HTML</b>
    <i>para </i> <code>exemplo </code> <pre>!!! </pre>
    <a href="https://unc.br/">UNC</a>`)
    ctx.replyWithMarkdown('Resposta com *Markdown*'
        + ' _para_ `exemplo` ```!!!```'
        + ' [UNC](https://unc.br/)')
    ctx.replyWithPhoto('https://prnt.sc/236m588',{caption: 'Saca só essa!'})
    ctx.replyWithLocation(-26.13325082245865, -49.80970946115138)
    })

    ctx.reply(`Seja bem vindo ${from.first_name}`)
    ctx.reply(`Funcionalidades:
            - com /lista posso guardar uma lista de filmes que você tenha interesse
            - com /respostas mostro algumas formas de resposta que tenho
            - ao ouvir: 📽️ ou popcorn vou te responder algo
            - digo as coordenadas de latitude e longitude se você me fornecer uma localização
            - retorno o nome e o telefone de um contato que você me fornecer
            - ouço uma mensagem e áudio e retorno a duração dela
            - informo a resolução das fotos que você me enviar`
    )

    const name = ctx.update.message.from.first_name
    const listScene = new Scene('list')
    listScene.enter(ctx => {
        ctx.reply(`Entrando em List Scene`)
        ctx.reply(`Escreva os filmes que você deseja adicionar...`)
        ctx.reply(`Outros possíveis comandos: /listar e /sair`)
    })
    listScene.leave(ctx => ctx.reply(`Saindo de List Scene`));
    listScene.command('sair', leave());
    listScene.command('listar', ctx => {
        const gerarBotoes = () => Extra.markup(
            Markup.inlineKeyboard(
                lista.map(item => Markup.callbackButton(item, `delete ${item}`)),
                { columns: 3 }
            )
        )

        ctx.reply(`Esta é sua lista de filmes:`, gerarBotoes())
        ctx.reply('Se quiser, pode adicionar mais filmes!!')
    })
    listScene.on('text', ctx => {
            const gerarBotoes = () => Extra.markup(
                Markup.inlineKeyboard(
                    lista.map(item => Markup.callbackButton(item, `delete ${item}`)),
                    { columns: 3 }
                )
            )
            lista.push(ctx.update.message.text)
            ctx.reply(`${ctx.update.message.text} adicionado!`, gerarBotoes())
            ctx.reply('Se quiser, pode adicionar mais filmes!!')
        

        bot.action(/delete (.+)/, ctx => {
            lista = lista.filter(item => item !== ctx.match[1])
            ctx.reply(`${ctx.match[1]} deletado!`, gerarBotoes())
        })
    })

    const stage = new Stage([listScene])
    bot.use(Session())
    bot.use(stage.middleware())
    bot.command('conversar', enter('talk'))
    bot.command('lista', enter('list'))
    bot.on('message', ctx => ctx.reply('Entre com /lista para ver e alterar sua lista de filmes, /respostas para testar os formatos de respostas, /help para pedir ajuda ou converse comigo!!'))
    }
})

bot.startPolling()