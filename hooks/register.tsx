import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { LastTurn } from '../types'

const SKILL = 'linus-torvalds-assistant'

const isOn = atom({ plugin: 'linus-torvalds-assistant', key: 'isOn' } as const, false)
const isDetailsOpen = atom({ plugin: 'linus-torvalds-assistant', key: 'isDetailsOpen' } as const, false)
const last = atom({ plugin: 'linus-torvalds-assistant', key: 'last' } as const, null)

const ACTIONS = [
  { key: 'arq', label: 'Arquitetura', hotkey: 'q', ask: 'a arquitetura deste projeto, com a banca de arquitetura de software' },
  { key: 'cod', label: 'Código', hotkey: 'w', ask: 'o código e os scripts deste projeto, com analistas seniores de cada linguagem presente' },
  { key: 'rede', label: 'Rede', hotkey: 'e', ask: 'as configurações de rede, roteamento e firewall deste projeto, com a banca de engenheiros de rede' },
  { key: 'infra', label: 'Infra', hotkey: 'r', ask: 'servidores, containers e infraestrutura deste projeto, com a banca de infraestrutura e SRE' },
  { key: 'seg', label: 'Segurança', hotkey: 't', ask: 'a segurança deste projeto como uma auditoria, com a banca de segurança (para sistema web, siga references/seguranca-web.md: cenário de exploração em cada achado e não altere nada)' },
] as const

export const register: Register = on => {
  let startedAt = 0
  let tools = 0

  on('session.start', async ($, e, next) => {
    // O modo on/off sobrevive entre sessões
    const saved = await $.store.get('isOn')
    if (typeof saved === 'boolean') await update($, isOn, () => saved)
    return next(e)
  })

  // Com o modo ligado, todo prompt digitado passa pela skill
  on('prompt.submit', async ($, e, next) => {
    startedAt = await $.clock.now()
    tools = 0
    // 'sdk': a extensão do VS Code pode não chegar como 'composer' (a confirmar no uso)
    const kind = e.origin?.kind
    const typed = kind === 'composer' || kind === 'bridge' || kind === 'sdk'
    if (typed && !e.command && !e.isMeta && (await read($, isOn))) {
      // Vai como contexto: o modelo lê, mas o texto do usuário fica como ele digitou
      return next({ ...e, context: [...(e.context ?? []), `Modo Linus ligado: use a skill ${SKILL} para responder.`] })
    }
    return next(e)
  })

  on('tool.call', ($, e, next) => {
    tools += 1
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const seconds = Math.round(((await $.clock.now()) - startedAt) / 1000)
    const turn: LastTurn = { seconds, tools }
    await update($, last, () => turn)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // Mantém o que outros mods (o ponytail) desenham na faixa
    const others = await next(e)
    if (e.props.hasSurvey) return others

    const { Box, Button, Text } = $.ui.resolve(e)
    const on_ = await read($, isOn)
    const details = await read($, isDetailsOpen)
    const turn = await read($, last)
    const busy = e.props.isWorking

    const review = (ask: string) => () =>
      void $.prompt.submit({
        text: `Use a skill ${SKILL} e revise ${ask}. Convoque a banca de especialistas seniores e entregue o relatório no formato da skill.`,
        asUser: true,
      })

    const deliver = () =>
      void $.prompt.submit({
        text: `Use a skill ${SKILL} no modo entrega para este website: siga references/entrega-web.md, meça tudo no navegador, mostre o placar inicial, corrija até todas as áreas passarem de 9,0 e pergunte antes de publicar.`,
        asUser: true,
      })

    const plan = async () => {
      const { text } = await $.prompt.read()
      const draft = text.trim()
      if (!draft) {
        $.ui.toast('Digite no prompt o que quer planejar e clique em Planejar')
        return
      }
      await $.prompt.fill({ text: '' })
      void $.prompt.submit({
        text: `Use a skill linus-planejador para planejar isto antes de mexer em qualquer coisa:\n\n${draft}`,
        asUser: true,
      })
    }

    const toggle = async () => {
      const value = !on_
      await update($, isOn, () => value)
      await $.store.set('isOn', value)
      $.ui.toast(value ? 'Modo Linus ligado: todo prompt passa pela revisão' : 'Modo Linus desligado')
    }

    const time = turn ? `${Math.floor(turn.seconds / 60)}m ${turn.seconds % 60}s` : '—'

    const bar = (
      <Box flexDirection="column">
        <Text dimColor>Do plugin linus-torvalds-assistant</Text>
        <Box flexDirection="row" columnGap={2}>
          <Button key="toggle" label={on_ ? '● on' : '○ off'} hotkey="o" onPress={toggle} />
          <Text dimColor>{`último ${time}`}</Text>
          {ACTIONS.map(a => (
            <Button key={a.key} label={a.label} hotkey={a.hotkey} onPress={review(a.ask)} />
          ))}
          <Button key="deliver" label="Entrega" hotkey="y" onPress={deliver} />
          <Button key="plan" label="Planejar" hotkey="p" onPress={plan} />
          <Button
            key="details"
            label="Detalhes"
            hotkey="d"
            onPress={() => update($, isDetailsOpen, v => !v)}
          />
        </Box>
        {details ? (
          <Text dimColor>
            {`Modo: ${on_ ? 'ligado (todo prompt vai pela skill)' : 'desligado'} · último turno: ${
              turn ? `${turn.seconds}s, ${turn.tools} chamadas de ferramenta` : 'nenhum ainda'
            }${busy ? ' · Claude trabalhando…' : ''}`}
          </Text>
        ) : null}
      </Box>
    )

    return (
      <Box flexDirection="column">
        {others}
        {bar}
      </Box>
    )
  })
}
