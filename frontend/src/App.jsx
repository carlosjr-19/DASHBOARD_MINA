import React, { useState, useEffect } from 'react';
import { api } from './api';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PedidosView from './views/PedidosView';
import CotizacionesView from './views/CotizacionesView';
import ProductosView from './views/ProductosView';
import InventarioView from './views/InventarioView';
import FinanzasView from './views/FinanzasView';
import CalculadoraView from './views/CalculadoraView';
import ClientesView from './views/ClientesView';
import LoginView from './views/LoginView';

import ModalCambiarEstatus from './components/ModalCambiarEstatus';
import ModalFactura from './components/ModalFactura';
import ModalCotizacionPdf from './components/ModalCotizacionPdf';
import ModalNuevoPedido from './components/ModalNuevoPedido';
import ModalNuevoProducto from './components/ModalNuevoProducto';
import ModalMovimientoCaja from './components/ModalMovimientoCaja';
import ModalRecoleccion from './components/ModalRecoleccion';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mina_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Mantener pestaña actual en localStorage tras recargar
  const [currentTab, setCurrentTab] = useState(() => {
    return localStorage.getItem('mina_current_tab') || 'pedidos';
  });

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    localStorage.setItem('mina_current_tab', tab);
  };

  // Estado para abrir y cerrar la barra lateral
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('mina_sidebar_open');
    if (saved !== null) return saved === 'true';
    return window.innerWidth >= 1024;
  });

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('mina_sidebar_open', String(next));
      return next;
    });
  };

  // Application Data State
  const [pedidos, setPedidos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [saldos, setSaldos] = useState({});
  const [materiales, setMateriales] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [recolecciones, setRecolecciones] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [selectedStatusOrder, setSelectedStatusOrder] = useState(null);
  const [selectedFacturaOrder, setSelectedFacturaOrder] = useState(null);
  const [selectedPdfOrder, setSelectedPdfOrder] = useState(null);
  const [isNuevoPedidoOpen, setIsNuevoPedidoOpen] = useState(false);
  const [nuevoPedidoTipo, setNuevoPedidoTipo] = useState('PEDIDO');
  const [editingOrder, setEditingOrder] = useState(null);
  const [isNuevoProductoOpen, setIsNuevoProductoOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  const [isMovimientoOpen, setIsMovimientoOpen] = useState(false);
  const [movimientoTipo, setMovimientoTipo] = useState('INGRESO');
  const [isRecoleccionOpen, setIsRecoleccionOpen] = useState(false);

  // Fetch all live data
  const fetchData = async () => {
    try {
      const [pedRes, invRes, movRes, salRes, matRes, cliRes, catRes, recRes] = await Promise.all([
        api.getPedidos().catch(() => []),
        api.getInventario().catch(() => []),
        api.getMovimientos().catch(() => []),
        api.getSaldos().catch(() => ({})),
        api.getMaterialesCalculadora().catch(() => []),
        api.getClientes().catch(() => []),
        api.getCatalogo().catch(() => []),
        api.getRecolecciones().catch(() => [])
      ]);

      setPedidos(pedRes);
      setInventario(invRes);
      setMovimientos(movRes);
      setSaldos(salRes);
      setMateriales(matRes);
      setClientes(cliRes);
      setCatalogo(catRes);
      setRecolecciones(recRes);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      // Sincronización en vivo cada 10 segundos
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Auth
  const handleLogin = async (email, password) => {
    const data = await api.login(email, password);
    setUser(data);
    localStorage.setItem('mina_user', JSON.stringify(data));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mina_user');
  };

  // Actions
  const handleSavePedido = async (payload) => {
    await api.savePedido(payload);
    await fetchData();
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setNuevoPedidoTipo(order.tipo);
    setIsNuevoPedidoOpen(true);
  };

  const handleStatusUpdate = async (id, status, motivo, fechaEntrega) => {
    await api.updateEstatus(id, status, motivo, fechaEntrega);
    await fetchData();
  };

  const handleFacturaUpdate = async (id, data) => {
    await api.updateFactura(id, data);
    await fetchData();
  };

  const handleDeletePedido = async (id) => {
    if (window.confirm(`¿Estás seguro de eliminar el registro ${id}?`)) {
      await api.deletePedido(id);
      await fetchData();
    }
  };

  const handleAprobarCotizacion = async (cotizacion) => {
    if (window.confirm(`¿Aprobar cotización ${cotizacion.id} y convertir a Pedido oficial?`)) {
      await api.updateEstatus(cotizacion.id, 'Aprobado');
      await fetchData();
      handleTabChange('pedidos');
    }
  };

  const handleSaveInsumo = async (insumo) => {
    await api.saveInsumo(insumo);
    await fetchData();
  };

  const handleDeleteInsumo = async (id) => {
    if (window.confirm('¿Eliminar este insumo del inventario?')) {
      await api.deleteInsumo(id);
      await fetchData();
    }
  };

  const handleSaveMovimiento = async (mov) => {
    await api.addMovimiento(mov);
    await fetchData();
  };

  const handleDeleteMovimiento = async (id) => {
    if (window.confirm('¿Eliminar este movimiento de caja?')) {
      await api.deleteMovimiento(id);
      await fetchData();
    }
  };

  const handleSaveRecoleccion = async (payload) => {
    await api.saveRecoleccion(payload);
    await fetchData();
    setIsRecoleccionOpen(false);
  };

  const handleDeleteRecoleccion = async (id) => {
    if (window.confirm('¿Eliminar esta recolección y revertir el prorrateo de gastos en los pedidos?')) {
      await api.deleteRecoleccion(id);
      await fetchData();
    }
  };

  const handleSaveMaterial = async (mat) => {
    await api.saveMaterialCalculadora(mat);
    await fetchData();
  };

  const handleDeleteMaterial = async (id) => {
    if (window.confirm('¿Deseas eliminar este material de la base de datos?')) {
      await api.deleteMaterialCalculadora(id);
      await fetchData();
    }
  };

  const handleSaveCliente = async (cli) => {
    await api.saveCliente(cli);
    await fetchData();
  };

  const handleDeleteCliente = async (nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar al cliente "${nombre}"?`)) {
      await api.deleteCliente(nombre);
      await fetchData();
    }
  };

  const handleSaveProductoCatalogo = async (prod) => {
    await api.saveProductoCatalogo(prod);
    await fetchData();
    setIsNuevoProductoOpen(false);
    setEditingProducto(null);
  };

  const handleDeleteProductoCatalogo = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto del catálogo?')) {
      await api.deleteProductoCatalogo(id);
      await fetchData();
    }
  };

  const handleExportarCalculadoraAPedido = (calculatedProd) => {
    setEditingOrder({
      id: null,
      tipo: 'PEDIDO',
      cliente: '',
      telefono: '',
      correo: '',
      productos: [calculatedProd]
    });
    setNuevoPedidoTipo('PEDIDO');
    setIsNuevoPedidoOpen(true);
  };

  // If not logged in, show login screen
  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#121314] text-gray-100 flex flex-col font-sans">
      {/* Top Fixed Header with fast action buttons and sidebar toggle */}
      <Navbar
        currentTab={currentTab}
        user={user}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        onOpenNuevoPedido={() => {
          setEditingOrder(null);
          setNuevoPedidoTipo('PEDIDO');
          setIsNuevoPedidoOpen(true);
        }}
        onOpenNuevoIngreso={() => {
          setMovimientoTipo('INGRESO');
          setIsMovimientoOpen(true);
        }}
        onOpenNuevoEgreso={() => {
          setMovimientoTipo('EGRESO');
          setIsMovimientoOpen(true);
        }}
      />

      {/* Content wrapper with Sidebar + Main Content */}
      <div className="flex-1 flex min-h-0 relative">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentTab={currentTab}
          setCurrentTab={(tab) => {
            handleTabChange(tab);
            if (window.innerWidth < 1024) {
              setSidebarOpen(false);
            }
          }}
          pedidos={pedidos}
          user={user}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className={`flex-1 min-w-0 p-3 sm:p-6 pb-20 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'w-full' : 'max-w-7xl mx-auto w-full'}`}>
        {currentTab === 'pedidos' && (
          <PedidosView
            pedidos={pedidos}
            onStatusClick={(order) => setSelectedStatusOrder(order)}
            onFacturaClick={(order) => setSelectedFacturaOrder(order)}
            onPdfClick={(order) => setSelectedPdfOrder(order)}
            onOpenNuevoPedido={() => {
              setEditingOrder(null);
              setNuevoPedidoTipo('PEDIDO');
              setIsNuevoPedidoOpen(true);
            }}
            onEdit={handleEditOrder}
            onDelete={handleDeletePedido}
          />
        )}

        {currentTab === 'cotizaciones' && (
          <CotizacionesView
            pedidos={pedidos}
            onStatusClick={(order) => setSelectedStatusOrder(order)}
            onFacturaClick={(order) => setSelectedFacturaOrder(order)}
            onPdfClick={(order) => setSelectedPdfOrder(order)}
            onAprobarCotizacion={handleAprobarCotizacion}
            onOpenNuevoPedido={() => {
              setEditingOrder(null);
              setNuevoPedidoTipo('COTIZACION');
              setIsNuevoPedidoOpen(true);
            }}
            onEdit={handleEditOrder}
            onDelete={handleDeletePedido}
          />
        )}

        {currentTab === 'productos' && (
          <ProductosView
            catalogo={catalogo}
            onOpenNuevoProducto={() => {
              setEditingProducto(null);
              setIsNuevoProductoOpen(true);
            }}
            onEditProducto={(prod) => {
              setEditingProducto(prod);
              setIsNuevoProductoOpen(true);
            }}
            onDeleteProducto={handleDeleteProductoCatalogo}
          />
        )}

        {currentTab === 'inventario' && (
          <InventarioView
            inventario={inventario}
            onSaveInsumo={handleSaveInsumo}
            onDeleteInsumo={handleDeleteInsumo}
          />
        )}

        {currentTab === 'finanzas' && (
          <FinanzasView
            pedidos={pedidos}
            movimientos={movimientos}
            saldos={saldos}
            recolecciones={recolecciones}
            onOpenIngreso={() => {
              setMovimientoTipo('INGRESO');
              setIsMovimientoOpen(true);
            }}
            onOpenEgreso={() => {
              setMovimientoTipo('EGRESO');
              setIsMovimientoOpen(true);
            }}
            onOpenRecoleccion={() => setIsRecoleccionOpen(true)}
            onDeleteMovimiento={handleDeleteMovimiento}
            onDeleteRecoleccion={handleDeleteRecoleccion}
          />
        )}

        {currentTab === 'calculadora' && (
          <CalculadoraView
            materiales={materiales}
            onSaveMaterial={handleSaveMaterial}
            onDeleteMaterial={handleDeleteMaterial}
            onExportarAPedido={handleExportarCalculadoraAPedido}
          />
        )}

        {currentTab === 'clientes' && (
          <ClientesView
            clientes={clientes}
            pedidos={pedidos}
            onSaveCliente={handleSaveCliente}
            onDeleteCliente={handleDeleteCliente}
          />
        )}
      </main>
      </div>

      {/* Global Modals */}
      {selectedStatusOrder && (
        <ModalCambiarEstatus
          order={selectedStatusOrder}
          onClose={() => setSelectedStatusOrder(null)}
          onSave={handleStatusUpdate}
        />
      )}

      {selectedFacturaOrder && (
        <ModalFactura
          order={selectedFacturaOrder}
          onClose={() => setSelectedFacturaOrder(null)}
          onSave={handleFacturaUpdate}
        />
      )}

      {selectedPdfOrder && (
        <ModalCotizacionPdf
          order={selectedPdfOrder}
          onClose={() => setSelectedPdfOrder(null)}
        />
      )}

      {isNuevoPedidoOpen && (
        <ModalNuevoPedido
          tipo={nuevoPedidoTipo}
          pedidos={pedidos}
          clientes={clientes}
          inventario={inventario}
          catalogo={catalogo}
          initialData={editingOrder}
          onClose={() => {
            setIsNuevoPedidoOpen(false);
            setEditingOrder(null);
          }}
          onSave={handleSavePedido}
        />
      )}

      {isNuevoProductoOpen && (
        <ModalNuevoProducto
          isOpen={isNuevoProductoOpen}
          editingProduct={editingProducto}
          inventario={inventario}
          onClose={() => {
            setIsNuevoProductoOpen(false);
            setEditingProducto(null);
          }}
          onSave={handleSaveProductoCatalogo}
        />
      )}

      {isMovimientoOpen && (
        <ModalMovimientoCaja
          tipo={movimientoTipo}
          pedidos={pedidos}
          onClose={() => setIsMovimientoOpen(false)}
          onSave={handleSaveMovimiento}
        />
      )}

      {isRecoleccionOpen && (
        <ModalRecoleccion
          pedidos={pedidos}
          onClose={() => setIsRecoleccionOpen(false)}
          onSave={handleSaveRecoleccion}
        />
      )}
    </div>
  );
}
