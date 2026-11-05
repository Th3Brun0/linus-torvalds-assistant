export type LastTurn = { seconds: number; tools: number }

declare module 'claude-code' {
  interface PluginState {
    'linus-torvalds-assistant': {
      isOn: boolean
      isDetailsOpen: boolean
      last: LastTurn | null
    }
  }
}
