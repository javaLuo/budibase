<script>
  import { getContext } from "svelte"

  const { authStore, linkable, styleable, builderStore } = getContext("sdk")
  const component = getContext("component")

  export let logoUrl
</script>

<div class="nav" use:styleable={$component.styles}>
  <div class="nav__top">
    <a href="/" use:linkable>
      {#if logoUrl}
        <img class="logo" alt="logo" src={logoUrl} height="48" />
      {/if}
    </a>
  </div>
  <div class="nav__menu">
    <slot />
  </div>
</div>

<style>
  .nav {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
  }

  .nav__top {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .nav__top img {
    margin-right: 16px;
  }

  .nav__controls {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
  }
  .nav__controls > div:hover {
    cursor: pointer;
    color: #4285f4;
  }

  .nav__menu {
    display: flex;
    margin-top: 40px;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
  }

  .nav__menu > * {
    margin-right: 16px;
  }

  :global(.nav__menu > a) {
    font-size: 1.5em;
    text-decoration: none;
    margin-right: 16px;
  }
</style>
