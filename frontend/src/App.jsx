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
import PendientesView from './views/PendientesView';
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
    try {
      const saved = localStorage.getItem('mina_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn('Error reading mina_user from localStorage:', e);
      localStorage.removeItem('mina_user');
      return null;
    }
  });

  // Mantener pestaña actual en localStorage tras recargar
  const [currentTab, setCurrentTab] = useState(() => {
    try {
      return localStorage.getItem('mina_current_tab') || 'pedidos';
    } catch {
      return 'pedidos';
    }
  });

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    localStorage.setItem('mina_current_tab', tab);
  };

  // Estado para abrir y cerrar la barra lateral
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('mina_sidebar_open');
      if (saved !== null) return saved === 'true';
    } catch {}
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
  const [pendientes, setPendientes] = useState([]);
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
  const [draftOrderInfo, setDraftOrderInfo] = useState(null);

  const checkDraftOrder = () => {
    try {
      const raw = localStorage.getItem('mina_draft_order');
      if (raw) {
        const d = JSON.parse(raw);
        const hasContent = 
          d && (
            (d.clienteNombre && d.clienteNombre.trim() !== '') ||
            (d.productos && d.productos.length > 0 && d.productos[0]?.nombre?.trim())
          );
        if (hasContent) {
          setDraftOrderInfo({
            tipo: d.tipo || 'PEDIDO',
            clienteNombre: d.clienteNombre || '',
            productosCount: (d.productos || []).filter(p => p.nombre?.trim()).length || 1,
            data: d
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Error reading draft in App:', e);
    }
    setDraftOrderInfo(null);
  };

  // Fetch all live data
  const fetchData = async () => {
    try {
      const [pedRes, invRes, movRes, salRes, matRes, cliRes, catRes, recRes, penRes] = await Promise.all([
        api.getPedidos().catch(() => []),
        api.getInventario().catch(() => []),
        api.getMovimientos().catch(() => []),
        api.getSaldos().catch(() => ({})),
        api.getMaterialesCalculadora().catch(() => []),
        api.getClientes().catch(() => []),
        api.getCatalogo().catch(() => []),
        api.getRecolecciones().catch(() => []),
        api.getPendientes().catch(() => [])
      ]);

      setPedidos(pedRes);
      setInventario(invRes);
      setMovimientos(movRes);
      setSaldos(salRes);
      setMateriales(matRes);
      setClientes(cliRes);
      setCatalogo(catRes);
      setRecolecciones(recRes);
      setPendientes(penRes);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      checkDraftOrder();
      const interval = setInterval(fetchData, 10000);
      window.addEventListener('mina_draft_updated', checkDraftOrder);
      return () => {
        clearInterval(interval);
        window.removeEventListener('mina_draft_updated', checkDraftOrder);
      };
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

  const handleCancelMovimiento = async (id, data) => {
    await api.cancelMovimiento(id, data);
    await fetchData();
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

  // Pendientes Handlers
  const handleSavePendiente = async (pen) => {
    await api.savePendiente(pen);
    await fetchData();
  };

  const handleDeletePendiente = async (id) => {
    await api.deletePendiente(id);
    await fetchData();
  };

  const handleUpdateEstatusPendiente = async (id, estatus) => {
    await api.updateEstatusPendiente(id, estatus);
    await fetchData();
  };

  const handleAddComentarioPendiente = async (id, comentario) => {
    await api.addComentarioPendiente(id, comentario);
    await fetchData();
  };

  const handleExportarCalculadoraAPedido = (calculatedProd) => {
    let baseData = null;
    try {
      const raw = localStorage.getItem('mina_draft_order');
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft) {
          const existingProds = (draft.productos || []).filter(p => p.nombre && p.nombre.trim() !== '');
          baseData = {
            id: null,
            tipo: draft.tipo || 'PEDIDO',
            cliente: draft.clienteNombre || '',
            telefono: draft.telefono || '',
            correo: draft.correo || '',
            fechaEntrega: draft.fechaEntrega || '',
            requiereFactura: draft.requiereFactura || false,
            tipoPersona: draft.tipoPersona || 'Fisica',
            rfc: draft.rfc || '',
            razonSocial: draft.razonSocial || '',
            cp: draft.cp || '',
            regimenFiscal: draft.regimenFiscal || '',
            usoCfdi: draft.usoCfdi || '',
            pagado: draft.pagado || 0,
            metodoPagoAnticipo: draft.metodoPagoAnticipo || 'NU MINA',
            productos: existingProds.length > 0 ? [...existingProds, calculatedProd] : [calculatedProd]
          };
        }
      }
    } catch (e) {
      console.warn('Error merging draft with calculator export:', e);
    }

    if (!baseData) {
      baseData = {
        id: null,
        tipo: 'PEDIDO',
        cliente: '',
        telefono: '',
        correo: '',
        productos: [calculatedProd]
      };
    }

    setEditingOrder(baseData);
    setNuevoPedidoTipo(baseData.tipo || 'PEDIDO');
    setIsNuevoPedidoOpen(true);
  };

  // If not logged in, show login screen
  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-th-121314 text-gray-100 flex flex-col font-sans">
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

      {/* Banner de Borrador Global (como Gmail) */}
      {draftOrderInfo && !isNuevoPedidoOpen && (
        <div className="bg-gradient-to-r from-[#3511A3] to-[#4F26E2] border-b border-purple-400/30 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs text-white z-30 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>
              Tienes un <strong>borrador no guardado de {draftOrderInfo.tipo === 'COTIZACION' ? 'cotización' : 'pedido'}</strong>
              {draftOrderInfo.clienteNombre ? ` para "${draftOrderInfo.clienteNombre}"` : ''} ({draftOrderInfo.productosCount} {draftOrderInfo.productosCount === 1 ? 'producto' : 'productos'}).
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingOrder(null);
                setNuevoPedidoTipo(draftOrderInfo.tipo || 'PEDIDO');
                setIsNuevoPedidoOpen(true);
              }}
              className="px-4 py-1.5 bg-white text-[#3511A3] font-extrabold rounded-full shadow-sm transition-all text-xs hover:bg-purple-50"
            >
              Retomar Borrador
            </button>
            <button
              onClick={() => {
                if (window.confirm('¿Deseas descartar el borrador pendiente?')) {
                  localStorage.removeItem('mina_draft_order');
                  setDraftOrderInfo(null);
                  window.dispatchEvent(new Event('mina_draft_updated'));
                }
              }}
              className="text-amber-300 hover:text-rose-400 underline font-medium text-xs transition-colors"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

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
          pendientes={pendientes}
          user={user}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className={`flex-1 min-w-0 p-3 sm:p-6 pb-20 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'w-full' : 'max-w-7xl mx-auto w-full'}`}>
        {currentTab === 'pendientes' && (
          <PendientesView
            pendientes={pendientes}
            onSavePendiente={handleSavePendiente}
            onDeletePendiente={handleDeletePendiente}
            onUpdateEstatus={handleUpdateEstatusPendiente}
            onAddComentario={handleAddComentarioPendiente}
            user={user}
          />
        )}

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
            onCancelMovimiento={handleCancelMovimiento}
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
