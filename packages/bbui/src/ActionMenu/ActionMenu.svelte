<script>
  import { setContext } from "svelte"
  import Popover from "../Popover/Popover.svelte"
  import Menu from "../Menu/Menu.svelte"

  export let disabled = false
  export let align = "left"

  let anchor
  let dropdown

  // This is needed because display: contents is considered "invisible".
  // It should only ever be an action button, so should be fine.
  function getAnchor(node) {
    anchor = node.firstChild
  }

  export const hide = () => {
    dropdown.hide()
  }
  export const show = () => {
    dropdown.show()
  }

  const openMenu = () => {
    if (!disabled) show()
  }

  setContext("actionMenu", { show, hide })
</script>

<div use:getAnchor on:click={openMenu}>
  <slot name="control" />
</div>
<Popover bind:this={dropdown} {anchor} {align}>
  <Menu>
    <slot />
  </Menu>
</Popover>
