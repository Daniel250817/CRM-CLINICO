import ExcelJS from 'exceljs';
import type { Cita } from '../services/citaService';

type EstadoReporte = 'confirmada' | 'cancelada';

interface ResumenEstado {
  estado: EstadoReporte;
  etiqueta: string;
  cantidad: number;
  porcentaje: number;
}

interface PersonaBasica {
  nombre?: string;
  apellidos?: string;
}

const obtenerNombreCompleto = (persona: PersonaBasica | undefined | null, valorPorDefecto: string) => {
  if (!persona) return valorPorDefecto;
  return `${persona.nombre || ''} ${persona.apellidos || ''}`.trim() || valorPorDefecto;
};

const formatearFecha = (fechaISO: string) => {
  return new Date(fechaISO).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const aplicarEncabezado = (worksheet: ExcelJS.Worksheet, fila: number, titulos: string[]) => {
  const row = worksheet.getRow(fila);
  row.values = titulos;
  row.height = 24;

  titulos.forEach((_, index) => {
    const cell = row.getCell(index + 1);
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 11,
      name: 'Calibri'
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E60FA' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1E1E1E' } },
      left: { style: 'thin', color: { argb: 'FF1E1E1E' } },
      bottom: { style: 'thin', color: { argb: 'FF1E1E1E' } },
      right: { style: 'thin', color: { argb: 'FF1E1E1E' } }
    };
  });
};

const aplicarBordes = (row: ExcelJS.Row, columnas: number[]) => {
  columnas.forEach((columnIndex) => {
    const cell = row.getCell(columnIndex);
    cell.font = {
      size: 11,
      name: 'Calibri'
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
    };
  });
};

export const exportDailyAppointmentReportToExcel = async (
  citas: Cita[],
  fechaReporte: string
) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const resumenSheet = workbook.addWorksheet('Resumen');
    const detalleSheet = workbook.addWorksheet('Detalle');

    workbook.creator = 'CRM Clínico';
    workbook.created = new Date();
    workbook.modified = new Date();

    const citasProcesadas = citas.filter((cita) => cita.estado === 'confirmada' || cita.estado === 'cancelada');
    const totalProcesadas = citasProcesadas.length;
    const confirmadas = citasProcesadas.filter((cita) => cita.estado === 'confirmada');
    const canceladas = citasProcesadas.filter((cita) => cita.estado === 'cancelada');

    const resumen: ResumenEstado[] = [
      {
        estado: 'confirmada',
        etiqueta: 'Confirmadas',
        cantidad: confirmadas.length,
        porcentaje: totalProcesadas > 0 ? (confirmadas.length / totalProcesadas) * 100 : 0
      },
      {
        estado: 'cancelada',
        etiqueta: 'Canceladas',
        cantidad: canceladas.length,
        porcentaje: totalProcesadas > 0 ? (canceladas.length / totalProcesadas) * 100 : 0
      }
    ];

    resumenSheet.getColumn(1).width = 24;
    resumenSheet.getColumn(2).width = 16;
    resumenSheet.getColumn(3).width = 18;
    resumenSheet.getColumn(4).width = 16;

    const tituloResumen = resumenSheet.getRow(1);
    tituloResumen.getCell(1).value = 'REPORTE DE AFLUENCIA DIARIA';
    tituloResumen.getCell(1).font = {
      bold: true,
      size: 15,
      name: 'Calibri'
    };

    const subtituloResumen = resumenSheet.getRow(2);
    subtituloResumen.getCell(1).value = `Fecha del reporte: ${new Date(`${fechaReporte}T00:00:00`).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })}`;
    subtituloResumen.getCell(1).font = {
      size: 11,
      name: 'Calibri'
    };

    const totalResumen = resumenSheet.getRow(3);
    totalResumen.getCell(1).value = `Citas procesadas: ${totalProcesadas}`;
    totalResumen.getCell(1).font = {
      size: 11,
      name: 'Calibri'
    };

    aplicarEncabezado(resumenSheet, 5, ['Estado', 'Cantidad', 'Porcentaje', 'Detalle']);

    resumen.forEach((item, index) => {
      const row = resumenSheet.getRow(6 + index);
      row.values = [item.etiqueta, item.cantidad, `${item.porcentaje.toFixed(1)}%`, item.estado];
      aplicarBordes(row, [1, 2, 3, 4]);
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
    });

    resumenSheet.getRow(9).getCell(1).value = `Total de confirmadas: ${confirmadas.length}`;
    resumenSheet.getRow(10).getCell(1).value = `Total de canceladas: ${canceladas.length}`;

    resumenSheet.views = [{ state: 'frozen', ySplit: 5 }];
    resumenSheet.autoFilter = { from: 'A5', to: 'D8' };

    detalleSheet.getColumn(1).width = 18;
    detalleSheet.getColumn(2).width = 24;
    detalleSheet.getColumn(3).width = 24;
    detalleSheet.getColumn(4).width = 22;
    detalleSheet.getColumn(5).width = 14;

    const tituloDetalle = detalleSheet.getRow(1);
    tituloDetalle.getCell(1).value = 'DETALLE DE CITAS CONFIRMADAS Y CANCELADAS';
    tituloDetalle.getCell(1).font = {
      bold: true,
      size: 15,
      name: 'Calibri'
    };

    const subtituloDetalle = detalleSheet.getRow(2);
    subtituloDetalle.getCell(1).value = `Fecha del reporte: ${new Date(`${fechaReporte}T00:00:00`).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })}`;
    subtituloDetalle.getCell(1).font = {
      size: 11,
      name: 'Calibri'
    };

    aplicarEncabezado(detalleSheet, 4, ['Fecha y hora', 'Paciente', 'Dentista', 'Servicio', 'Estado']);

    citasProcesadas
      .slice()
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
      .forEach((cita, index) => {
        const row = detalleSheet.getRow(5 + index);
        row.values = [
          formatearFecha(cita.fechaHora),
          obtenerNombreCompleto(cita.cliente?.usuario as PersonaBasica | undefined, 'Sin nombre'),
          obtenerNombreCompleto(cita.dentista?.usuario as PersonaBasica | undefined, 'Sin dentista'),
          cita.servicio?.nombre || 'Sin servicio',
          cita.estado === 'confirmada' ? 'Confirmada' : 'Cancelada'
        ];
        aplicarBordes(row, [1, 2, 3, 4, 5]);
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      });

    detalleSheet.views = [{ state: 'frozen', ySplit: 4 }];
    detalleSheet.autoFilter = {
      from: 'A4',
      to: `E${Math.max(4, 4 + citasProcesadas.length)}`
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Afluencia_${fechaReporte}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error al exportar el reporte de afluencia:', error);
    throw new Error('No se pudo exportar el reporte de afluencia. Intente de nuevo.');
  }
};