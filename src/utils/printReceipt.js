const PRINT_ROOT_ID = 'print-only-recibo'

function stylePrintClone(clone) {
  clone.querySelectorAll('.no-print').forEach((el) => el.remove())
}

/** Imprime solo el recibo visible (una hoja, sin páginas en blanco). */
export function printReceipt() {
  const root = document.querySelector('.recibo-print-root')
  if (!root) {
    window.print()
    return
  }

  document.getElementById(PRINT_ROOT_ID)?.remove()

  const clone = root.cloneNode(true)
  clone.id = PRINT_ROOT_ID
  stylePrintClone(clone)
  document.body.appendChild(clone)
  document.body.classList.add('printing-recibo')

  const cleanup = () => {
    document.body.classList.remove('printing-recibo')
    document.getElementById(PRINT_ROOT_ID)?.remove()
  }

  window.addEventListener('afterprint', cleanup, { once: true })
  window.print()
}
