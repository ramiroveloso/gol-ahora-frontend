import React, { useState, useEffect } from 'react'
import { api, applyDiscountToAmount } from '../services/api.js'
import { printReceipt } from '../utils/printReceipt.js'

const METHODS = [
  { id: 'tarjeta', label: 'Tarjeta débito/crédito', icon: 'credit_card' },
  { id: 'efectivo', label: 'Efectivo en caja', icon: 'payments' },
  { id: 'transferencia', label: 'Transferencia', icon: 'account_balance' },
]

function PaymentModal({ booking, currentUser, onClose, onPaymentSuccess, showToast }) {
  const [method, setMethod] = useState('tarjeta')
  const [processing, setProcessing] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [descuentos, setDescuentos] = useState([])
  const [selectedDescuentoId, setSelectedDescuentoId] = useState('')

  useEffect(() => {
    let cancelled = false
    api.getDescuentos()
      .then((list) => {
        if (!cancelled) setDescuentos(list.filter((d) => d.activo))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [booking?.id])

  const selectedDescuento = descuentos.find((d) => d.id === selectedDescuentoId) || null
  const basePrice = Number(booking?.totalPrice) || 0
  const finalPrice = selectedDescuento
    ? applyDiscountToAmount(basePrice, selectedDescuento)
    : basePrice

  if (!booking) return null

  const formatDate = (d) => {
    try {
      return new Date(`${d}T12:00:00`).toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    } catch {
      return d
    }
  }

  const handlePay = async () => {
    setProcessing(true)
    try {
      const result = await api.processPayment(
        booking.id,
        method,
        booking,
        selectedDescuentoId || null,
      )
      setReceipt(result.recibo)
      onPaymentSuccess(result)
      showToast?.('Pago aprobado. Reserva confirmada.', 'success')
    } catch (err) {
      showToast?.(err.message || 'Error al procesar el pago', 'error')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div
      className="payment-modal-overlay"
      onClick={onClose}
      role="presentation"
      aria-hidden={false}
    >
      <div
        className="payment-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
      >
        <button type="button" className="payment-modal-close" onClick={onClose} aria-label="Cerrar">
          <span className="material-symbols-outlined">close</span>
        </button>

        {!receipt ? (
          <>
            <div className="payment-modal-header">
              <span className="material-symbols-outlined payment-icon">payments</span>
              <h3 id="payment-modal-title">Confirmar pago</h3>
              <p>La reserva pasa a <strong>Confirmada</strong> cuando el cobro queda aprobado.</p>
            </div>

            <div className="payment-summary">
              <div className="payment-summary-row">
                <span>Cancha</span>
                <strong>{booking.courtName}</strong>
              </div>
              <div className="payment-summary-row">
                <span>Fecha y horario</span>
                <strong>
                  {formatDate(booking.date)} · {booking.time}
                </strong>
              </div>
              <div className="payment-summary-row">
                <span>Cliente</span>
                <strong>{currentUser?.name}</strong>
              </div>
              <div className="payment-summary-row total">
                <span>Total a pagar</span>
                <strong>${finalPrice.toFixed(2)}</strong>
              </div>
              {selectedDescuento && finalPrice < basePrice && (
                <div className="payment-summary-row" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Descuento aplicado</span>
                  <span>- ${(basePrice - finalPrice).toFixed(2)} ({selectedDescuento.label})</span>
                </div>
              )}
            </div>

            {descuentos.length > 0 && (
              <>
                <label className="payment-methods-label" htmlFor="payment-discount">
                  Descuento (opcional)
                </label>
                <select
                  id="payment-discount"
                  value={selectedDescuentoId}
                  onChange={(e) => setSelectedDescuentoId(e.target.value)}
                  className="bookings-sort-select"
                  style={{ width: '100%', marginBottom: '1rem' }}
                >
                  <option value="">Sin descuento</option>
                  {descuentos.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </>
            )}

            <label className="payment-methods-label">Método de pago</label>
            <div className="payment-methods">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`payment-method ${method === m.id ? 'selected' : ''}`}
                  onClick={() => setMethod(m.id)}
                >
                  <span className="material-symbols-outlined">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>

            <div className="payment-modal-footer">
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={processing}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handlePay} disabled={processing}>
                {processing ? 'Procesando...' : 'Pagar y confirmar'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="recibo-print-root">
              <div className="payment-modal-header receipt-header">
                <span className="material-symbols-outlined payment-icon success no-print">check_circle</span>
                <h3>Recibo de pago</h3>
                <p>
                  Recibo Nº {receipt.numero}
                  {receipt.cobroId ? ` · Cobro #${receipt.cobroId}` : ''}
                </p>
              </div>

              <div className="receipt-body">
              <div className="receipt-brand">GOL AHORA</div>
              {receipt.detalle && (
                <div className="receipt-line">
                  <span>Detalle</span>
                  <span>{receipt.detalle}</span>
                </div>
              )}
              <div className="receipt-line">
                <span>Fecha emisión</span>
                <span>{new Date(receipt.emitidoEn).toLocaleString('es-AR')}</span>
              </div>
              <div className="receipt-line">
                <span>Cliente</span>
                <span>{receipt.cliente}</span>
              </div>
              <div className="receipt-line">
                <span>Concepto</span>
                <span>
                  Reserva {receipt.courtName} — {receipt.fecha} {receipt.horario}
                </span>
              </div>
              <div className="receipt-line">
                <span>Método</span>
                <span style={{ textTransform: 'capitalize' }}>{receipt.metodoPago}</span>
              </div>
              <div className="receipt-line receipt-total">
                <span>Importe</span>
                <strong>${Number(receipt.monto).toFixed(2)}</strong>
              </div>
              <p className="receipt-legal">Comprobante válido como constancia de pago digital.</p>
              </div>
            </div>

            <div className="payment-modal-footer no-print">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => printReceipt()}
              >
                <span className="material-symbols-outlined">print</span>
                Imprimir
              </button>
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Finalizar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default PaymentModal
