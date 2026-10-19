// Centralized API client for MINA DESIGN ERP
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al iniciar sesión');
    }
    return res.json();
  },

  // Pedidos & Cotizaciones
  async getPedidos() {
    const res = await fetch(`${BASE_URL}/pedidos`);
    if (!res.ok) throw new Error('Error al cargar pedidos');
    return res.json();
  },

  async savePedido(pedidoData) {
    const res = await fetch(`${BASE_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedidoData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al guardar el pedido');
    }
    return res.json();
  },

  async updateEstatus(id, estatus, motivoCancelacion = null, fechaEntrega = null) {
    const res = await fetch(`${BASE_URL}/pedidos/${id}/estatus`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estatus, motivoCancelacion, fechaEntrega })
    });
    if (!res.ok) throw new Error('Error al actualizar estatus');
    return res.json();
  },

  async updateFactura(id, facturaData) {
    const res = await fetch(`${BASE_URL}/pedidos/${id}/factura`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(facturaData)
    });
    if (!res.ok) throw new Error('Error al actualizar factura');
    return res.json();
  },

  async deletePedido(id) {
    const res = await fetch(`${BASE_URL}/pedidos/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar pedido');
    return res.json();
  },

  // Inventario
  async getInventario() {
    const res = await fetch(`${BASE_URL}/inventario`);
    if (!res.ok) throw new Error('Error al cargar inventario');
    return res.json();
  },

  async saveInsumo(insumo) {
    const res = await fetch(`${BASE_URL}/inventario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(insumo)
    });
    if (!res.ok) throw new Error('Error al guardar insumo');
    return res.json();
  },

  async deleteInsumo(id) {
    const res = await fetch(`${BASE_URL}/inventario/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar insumo');
    return res.json();
  },

  // Finanzas / Movimientos de Caja
  async getMovimientos() {
    const res = await fetch(`${BASE_URL}/finanzas/movimientos`);
    if (!res.ok) throw new Error('Error al cargar movimientos');
    return res.json();
  },

  async getSaldos() {
    const res = await fetch(`${BASE_URL}/finanzas/saldos`);
    if (!res.ok) throw new Error('Error al cargar saldos');
    return res.json();
  },

  async addMovimiento(movimiento) {
    const res = await fetch(`${BASE_URL}/finanzas/movimientos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movimiento)
    });
    if (!res.ok) throw new Error('Error al guardar movimiento');
    return res.json();
  },

  async deleteMovimiento(id) {
    const res = await fetch(`${BASE_URL}/finanzas/movimientos/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar movimiento');
    return res.json();
  },

  // Recolecciones
  async getRecolecciones() {
    const res = await fetch(`${BASE_URL}/finanzas/recolecciones`);
    if (!res.ok) throw new Error('Error al cargar recolecciones');
    return res.json();
  },

  async saveRecoleccion(data) {
    const res = await fetch(`${BASE_URL}/finanzas/recolecciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al registrar recolección');
    return res.json();
  },

  async deleteRecoleccion(id) {
    const res = await fetch(`${BASE_URL}/finanzas/recolecciones/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar recolección');
    return res.json();
  },

  // Calculadora de Área
  async getMaterialesCalculadora() {
    const res = await fetch(`${BASE_URL}/calculadora/materiales`);
    if (!res.ok) throw new Error('Error al cargar materiales');
    return res.json();
  },

  async saveMaterialCalculadora(material) {
    const res = await fetch(`${BASE_URL}/calculadora/materiales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(material)
    });
    if (!res.ok) throw new Error('Error al guardar material');
    return res.json();
  },

  async deleteMaterialCalculadora(id) {
    const res = await fetch(`${BASE_URL}/calculadora/materiales/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar material');
    return res.json();
  },

  // Clientes
  async getClientes() {
    const res = await fetch(`${BASE_URL}/clientes`);
    if (!res.ok) throw new Error('Error al cargar clientes');
    return res.json();
  },

  async saveCliente(cliente) {
    const res = await fetch(`${BASE_URL}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cliente)
    });
    if (!res.ok) throw new Error('Error al guardar cliente');
    return res.json();
  },

  async deleteCliente(nombre) {
    const res = await fetch(`${BASE_URL}/clientes/${encodeURIComponent(nombre)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar cliente');
    return res.json();
  },

  // Catálogo de Productos y Servicios
  async getCatalogo() {
    const res = await fetch(`${BASE_URL}/catalogo`);
    if (!res.ok) throw new Error('Error al cargar catálogo de productos');
    return res.json();
  },

  async saveProductoCatalogo(producto) {
    const res = await fetch(`${BASE_URL}/catalogo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(producto)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al guardar producto en catálogo');
    }
    return res.json();
  },

  async deleteProductoCatalogo(id) {
    const res = await fetch(`${BASE_URL}/catalogo/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar producto del catálogo');
    return res.json();
  }
};

