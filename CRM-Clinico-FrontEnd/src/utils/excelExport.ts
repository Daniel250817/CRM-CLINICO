import ExcelJS from 'exceljs';
import type { Cliente } from '../services/clienteService';

/**
 * Exporta la lista de pacientes a un archivo Excel con formato profesional
 * @param patients - Array de pacientes a exportar
 * @param filename - Nombre del archivo (opcional)
 */
export const exportPatientsToExcel = async (
  patients: Cliente[],
  filename: string = 'Pacientes_Export'
) => {
  try {
    // Crear un nuevo libro de trabajo
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pacientes');

    // Configurar propiedades del documento
    workbook.creator = 'CRM Clínico';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Definir anchos de columnas
    worksheet.columns = [
      { key: 'id', width: 8 },
      { key: 'nombre', width: 25 },
      { key: 'email', width: 30 },
      { key: 'telefono', width: 15 },
      { key: 'estadoTratamiento', width: 22 },
      { key: 'ultimaVisita', width: 18 },
      { key: 'proximaCita', width: 20 },
      { key: 'alergias', width: 30 },
      { key: 'cirugiasPrevias', width: 30 },
      { key: 'enfermedadesCronicas', width: 30 },
      { key: 'medicamentosActuales', width: 30 },
    ];

    // FILA 1: Título del reporte
    const titleRow = worksheet.getRow(1);
    titleRow.getCell('A').value = 'REPORTE DE PACIENTES - CLÍNICA DENTAL';
    titleRow.getCell('A').font = {
      bold: true,
      size: 14,
      name: 'Calibri'
    };
    titleRow.getCell('A').alignment = {
      vertical: 'middle',
      horizontal: 'left'
    };
    titleRow.height = 25;

    // FILA 2: Fecha de generación
    const now = new Date();
    const fechaGeneracion = `Fecha de generación: ${now.getDate()} de ${now.toLocaleDateString('es-ES', { month: 'long' })} de ${now.getFullYear()}, ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    const dateRow = worksheet.getRow(2);
    dateRow.getCell('A').value = fechaGeneracion;
    dateRow.getCell('A').font = {
      size: 11,
      name: 'Calibri'
    };
    dateRow.height = 20;

    // FILA 3: Total de pacientes
    const totalRow = worksheet.getRow(3);
    totalRow.getCell('A').value = `Total de pacientes: ${patients.length}`;
    totalRow.getCell('A').font = {
      size: 11,
      name: 'Calibri'
    };
    totalRow.height = 20;

    // FILA 4: Vacía (separador)
    worksheet.getRow(4).height = 10;

    // FILA 5: Encabezados de la tabla
    const headerRow = worksheet.getRow(5);
    headerRow.values = [
      'ID', 
      'Nombre', 
      'Email', 
      'Teléfono', 
      'Estado de Tratamiento', 
      'Última Visita', 
      'Próxima Cita',
      'Alergias',
      'Cirugías Previas',
      'Enfermedades Crónicas',
      'Medicamentos Actuales'
    ];
    headerRow.height = 25;
    
    const columnas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
    columnas.forEach((col) => {
      const cell = headerRow.getCell(col);
      
      cell.font = { 
        bold: true, 
        color: { argb: 'FFFFFFFF' },
        size: 11,
        name: 'Calibri'
      };
      
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' } // Azul más oscuro similar a la imagen
      };
      
      cell.alignment = { 
        vertical: 'middle', 
        horizontal: 'center' 
      };
      
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // Formatear fechas
    const formatDate = (date: string | undefined) => {
      if (!date) return 'Sin visitas';
      return new Date(date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });
    };

    // Agregar los datos de los pacientes (comienzan en la fila 6)
    patients.forEach((patient, index) => {
      const rowIndex = 6 + index;
      const row = worksheet.getRow(rowIndex);
      
      row.values = [
        patient.id,
        patient.name,
        patient.email,
        patient.phone,
        patient.treatmentStatus || 'N/A',
        formatDate(patient.lastVisit),
        patient.nextVisit ? formatDate(patient.nextVisit) : 'Sin cita programada',
        patient.historialMedico?.alergias || 'N/A',
        patient.historialMedico?.cirugiasPrevias || 'N/A',
        patient.historialMedico?.enfermedadesCronicas || 'N/A',
        patient.historialMedico?.medicamentosActuales || 'N/A'
      ];

      // Aplicar estilos solo a las columnas A-K (las 11 columnas de la tabla)
      const columnas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
      
      columnas.forEach((col) => {
        const cell = row.getCell(col);
        
        // Alineación de celdas
        if (col === 'A') {
          // Centrar solo el ID
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }

        // Fuente estándar
        cell.font = {
          size: 11,
          name: 'Calibri'
        };

        // Agregar bordes
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
        };
      });

      row.height = 20;
    });

    // Agregar filtros automáticos en la fila de encabezados (fila 5)
    worksheet.autoFilter = {
      from: 'A5',
      to: 'K5'
    };

    // Congelar las primeras 5 filas (título, fecha, total, separador y encabezados)
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 5 }
    ];

    // Generar el archivo y descargarlo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    // Crear un enlace temporal para descargar el archivo
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Agregar fecha al nombre del archivo
    const date = new Date().toISOString().split('T')[0];
    link.download = `${filename}_${date}.xlsx`;
    
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    throw new Error('No se pudo exportar el archivo. Por favor, intente de nuevo.');
  }
};

/**
 * Exporta los pacientes filtrados actualmente visibles
 * @param patients - Array de pacientes filtrados
 */
export const exportFilteredPatients = async (patients: Cliente[]) => {
  return exportPatientsToExcel(patients, 'Pacientes_Filtrados');
};

/**
 * Exporta todos los pacientes
 * @param patients - Array completo de pacientes
 */
export const exportAllPatients = async (patients: Cliente[]) => {
  return exportPatientsToExcel(patients, 'Todos_los_Pacientes');
};

