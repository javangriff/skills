export function renderSaveForm(container: HTMLElement, onSave: (name: string) => void): void {
  container.innerHTML = `
    <form data-testid="save-form">
      <label for="name">Name</label>
      <input id="name" data-testid="name-input" />
      <button type="submit" data-testid="save-button">Save</button>
      <div class="spinner" data-testid="spinner" hidden></div>
    </form>
  `
  const form = container.querySelector('form')!
  const input = container.querySelector('input')!
  const spinner = container.querySelector<HTMLElement>('.spinner')!
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    spinner.hidden = false
    onSave(input.value)
  })
}
