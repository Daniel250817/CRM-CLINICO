const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  AlignmentType,
  HeadingLevel,
  LevelFormat,
  BorderStyle,
  WidthType,
  ShadingType,
  VerticalAlign,
  PageNumber,
} = require("/tmp/pdf-extract/node_modules/docx");
const fs = require("fs");
const path = require("path");

const PAGE_W = 12240;
const M = 1080;
const CONTENT_W = PAGE_W - M * 2;

const thin = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const borders = { top: thin, bottom: thin, left: thin, right: thin };

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    alignment: opts.align,
    children: [
      new TextRun({
        text,
        font: "Calibri",
        size: opts.size ?? 22,
        bold: opts.bold,
        italics: opts.italics,
      }),
    ],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 200, after: 140 },
    children: [new TextRun({ text, font: "Calibri", bold: true, size: 28 })],
  });
}

function item(text, level) {
  return new Paragraph({
    numbering: { reference: "smartart", level },
    spacing: { after: 40 },
    children: [new TextRun({ text, font: "Calibri", size: 22 })],
  });
}

function cell(text, width, opts = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: opts.header ? { type: ShadingType.CLEAR, fill: "D9D9D9" } : undefined,
    borders,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 50, bottom: 50, left: 80, right: 80 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: opts.bold || opts.header,
            font: "Calibri",
            size: 17,
          }),
        ],
      }),
    ],
  });
}

const dw = [1400, 2600, 3200, 3600];
const dict = [
  ["1", "Área pública", "App.tsx", "Acceso visible sin sesión."],
  ["1.1", "Inicio de sesión", "Login.tsx", "Valida credenciales y abre el sistema."],
  ["1.2", "Recuperación de contraseña", "ForgotPassword.tsx", "Restablece la clave con token."],
  ["2", "Área privada", "MainLayout.tsx", "Menú operativo según el rol."],
  ["2.1", "Panel de control", "Dashboard.tsx", "Resumen de la operación diaria."],
  ["2.2", "Citas", "AppointmentCalendar.tsx", "Agenda de paciente, dentista y servicio."],
  ["2.3", "Pacientes", "PatientsList.tsx", "Registro y mantenimiento de pacientes."],
  ["2.3.1", "Expediente clínico", "PatientProfile.tsx", "Historial médico y datos personales."],
  ["2.3.2", "Documentos clínicos", "documentoService.ts", "Archivos del expediente."],
  ["2.3.3", "Tratamientos", "tratamiento.js", "Plan de atención con sesiones."],
  ["2.4", "Facturación", "BillingPage.tsx", "Cobro de la atención."],
  ["2.5", "Tareas y notas", "TaskBoard.tsx", "Trabajo interno del personal."],
  ["2.6", "Notificaciones", "NotificationSystem.tsx", "Avisos de citas y tareas."],
  ["2.7", "Configuración", "UserSettings.tsx", "Tema, idioma, avisos y avatar."],
  ["3", "Área de administración", "SideNav.tsx", "Configuración de usuarios y catálogo."],
  ["3.1", "Usuarios y roles", "usuarioController.js", "Cuentas admin, dentista y cliente."],
  ["3.2", "Dentistas", "DentistasPage.tsx", "Perfil profesional y horario."],
  ["3.3", "Catálogo de servicios", "ServiciosList.tsx", "Tratamientos, precio y duración."],
];

const doc = new Document({
  creator: "CRM Clínico",
  title: "Diagrama funcional y diccionario de datos — CRM Clínico",
  numbering: {
    config: [
      {
        reference: "smartart",
        levels: [0, 1, 2, 3].map((level) => ({
          level,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: {
              indent: { left: 360 + level * 360, hanging: 180 },
            },
          },
        })),
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: M, bottom: M, left: M, right: M },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "CRM Clínico  ·  Diagrama funcional y diccionario de datos", font: "Calibri", size: 16 })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "Página ", font: "Calibri", size: 16 }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 16 }),
              ],
            }),
          ],
        }),
      },
      children: [
        h1("1. Diagrama funcional"),
        p("Selecciona la lista, ve a Insertar → SmartArt → Jerarquía → Organigrama. Cada sangría es un nivel. En cada caja, con Mayús+Entrar, agrega el programa en la segunda línea."),
        item("CRM CLÍNICO", 0),
        item("Área pública", 1),
        item("Inicio de sesión", 2),
        item("Recuperación de contraseña", 2),
        item("Área privada", 1),
        item("Panel de control", 2),
        item("Citas", 2),
        item("Pacientes", 2),
        item("Expediente clínico", 3),
        item("Documentos clínicos", 3),
        item("Tratamientos", 3),
        item("Facturación", 2),
        item("Tareas y notas", 2),
        item("Notificaciones", 2),
        item("Configuración", 2),
        item("Área de administración", 1),
        item("Usuarios y roles", 2),
        item("Dentistas", 2),
        item("Catálogo de servicios", 2),
        p("Programas de cada caja (segunda línea, como en el ejemplo de la unidad):", { before: 280, bold: true }),
        p("CRM CLÍNICO → App.tsx"),
        p("Área pública → App.tsx"),
        p("Inicio de sesión → Login.tsx"),
        p("Recuperación de contraseña → ForgotPassword.tsx"),
        p("Área privada → MainLayout.tsx"),
        p("Panel de control → Dashboard.tsx"),
        p("Citas → AppointmentCalendar.tsx"),
        p("Pacientes → PatientsList.tsx"),
        p("Expediente clínico → PatientProfile.tsx"),
        p("Documentos clínicos → documentoService.ts"),
        p("Tratamientos → tratamiento.js"),
        p("Facturación → BillingPage.tsx"),
        p("Tareas y notas → TaskBoard.tsx"),
        p("Notificaciones → NotificationSystem.tsx"),
        p("Configuración → UserSettings.tsx"),
        p("Área de administración → SideNav.tsx"),
        p("Usuarios y roles → usuarioController.js"),
        p("Dentistas → DentistasPage.tsx"),
        p("Catálogo de servicios → ServiciosList.tsx"),
        new Paragraph({ children: [], pageBreakBefore: true }),
        h1("2. Diccionario de datos"),
        p("Una fila por cada caja del diagrama."),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: dw,
          rows: [
            new TableRow({
              tableHeader: true,
              children: ["Referencia", "Función", "Programa/Módulo", "Descripción"].map((h, i) =>
                cell(h, dw[i], { header: true })
              ),
            }),
            ...dict.map((row) =>
              new TableRow({
                children: row.map((val, i) => cell(val, dw[i], { bold: i === 0 })),
              })
            ),
          ],
        }),
      ],
    },
  ],
});

const out = path.join(__dirname, "Modelo_Conceptual_y_Diccionario_de_Datos.docx");
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(out, buffer);
  console.log("OK", out);
});
