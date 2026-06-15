export type Macro = {
  shortcode: string;
  full_text: string;
  category: string;
};

export const DEFAULT_MACROS: Macro[] = [
  // ============ MUESTRA ============
  { shortcode: '.m1', full_text: 'Muestra adecuada para evaluación. Contiene células endocervicales y de la zona de transformación.', category: 'Muestra' },
  { shortcode: '.m2', full_text: 'Muestra adecuada para evaluación. No contiene células endocervicales ni de la zona de transformación.', category: 'Muestra' },
  { shortcode: '.m3', full_text: 'Muestra limitada por escasa celularidad.', category: 'Muestra' },
  { shortcode: '.m4', full_text: 'Muestra limitada por hemorragia.', category: 'Muestra' },
  { shortcode: '.m5', full_text: 'Muestra limitada por inflamación severa.', category: 'Muestra' },
  { shortcode: '.m6', full_text: 'Muestra limitada por falta de celularidad endocervical.', category: 'Muestra' },
  { shortcode: '.m7', full_text: 'Muestra rechazada / no procesada por inadecuada identificación.', category: 'Muestra' },
  { shortcode: '.m8', full_text: 'Muestra rechazada / no procesada por portaobjetos roto.', category: 'Muestra' },
  { shortcode: '.m9', full_text: 'Muestra rechazada / no procesada por fijación inadecuada.', category: 'Muestra' },
  { shortcode: '.m10', full_text: 'Muestra procesada y evaluada. Celularidad escamosa adecuada.', category: 'Muestra' },

  // ============ NILM / NEGATIVO ============
  { shortcode: '.b1', full_text: 'Negativo para lesión intraepitelial o malignidad (NILM).', category: 'Bethesda' },

  // ============ MICROORGANISMOS ============
  { shortcode: '.mo1', full_text: 'Infección: Trichomonas vaginalis.', category: 'Microorganismos' },
  { shortcode: '.mo2', full_text: 'Infección: Candida spp.', category: 'Microorganismos' },
  { shortcode: '.mo3', full_text: 'Cambios celulares compatibles con virus herpes simple (HSV).', category: 'Microorganismos' },
  { shortcode: '.mo4', full_text: 'Infección: Actinomyces spp.', category: 'Microorganismos' },
  { shortcode: '.mo5', full_text: 'Cambios celulares sugestivos de infección por VPH (sin ASC / LSIL).', category: 'Microorganismos' },
  { shortcode: '.mo6', full_text: 'Flora mixta sugestiva de vaginosis bacteriana.', category: 'Microorganismos' },
  { shortcode: '.mo7', full_text: 'Leucocitos: abundantes. Flora mixta sugestiva de vaginosis bacteriana.', category: 'Microorganismos' },
  { shortcode: '.mo8', full_text: 'Cambios citopáticos compatibles con Chlamydia trachomatis (sugerente).', category: 'Microorganismos' },
  { shortcode: '.mo9', full_text: 'Presencia de Leptothrix spp.', category: 'Microorganismos' },
  { shortcode: '.mo10', full_text: 'Bacilos Döderlein: flora lactobacilar predominante.', category: 'Microorganismos' },

  // ============ CAMBIOS REACTIVOS ============
  { shortcode: '.cr1', full_text: 'Cambios celulares reactivos: Inflamación (incluye cambios reparativos).', category: 'Cambios Reactivos' },
  { shortcode: '.cr2', full_text: 'Cambios celulares reactivos: Reparación.', category: 'Cambios Reactivos' },
  { shortcode: '.cr3', full_text: 'Cambios celulares reactivos: Radiación.', category: 'Cambios Reactivos' },
  { shortcode: '.cr4', full_text: 'Cambios celulares reactivos: Dispositivo intrauterino (DIU).', category: 'Cambios Reactivos' },
  { shortcode: '.cr5', full_text: 'Atrofia con inflamación (vaginitis atrófica).', category: 'Cambios Reactivos' },
  { shortcode: '.cr6', full_text: 'Cambios celulares reactivos asociados a post-parto.', category: 'Cambios Reactivos' },
  { shortcode: '.cr7', full_text: 'Cambios celulares reactivos inespecíficos.', category: 'Cambios Reactivos' },
  { shortcode: '.cr8', full_text: 'Metaplasia escamosa inmadura reactiva.', category: 'Cambios Reactivos' },
  { shortcode: '.cr9', full_text: 'Células endocervicales con cambios reactivos.', category: 'Cambios Reactivos' },
  { shortcode: '.cr10', full_text: 'Células endometriales con cambios reactivos.', category: 'Cambios Reactivos' },
  { shortcode: '.cr11', full_text: 'Hiperqueratosis / paraqueratosis reactiva.', category: 'Cambios Reactivos' },
  { shortcode: '.cr12', full_text: 'Cambios asociados a prolapso genital (acantosis / hiperqueratosis).', category: 'Cambios Reactivos' },

  // ============ ESCAMOSAS: ASC-US ============
  { shortcode: '.b2', full_text: 'ASC-US: Células escamosas atípicas de significado indeterminado.', category: 'Escamosas' },
  { shortcode: '.b2a', full_text: 'ASC-US: Células escamosas atípicas de significado indeterminado. Sugerente de VPH.', category: 'Escamosas' },
  { shortcode: '.b2b', full_text: 'ASC-US: Células escamosas atípicas de significado indeterminado. Favorece reactivo.', category: 'Escamosas' },
  { shortcode: '.b2c', full_text: 'ASC-US: Células escamosas atípicas de significado indeterminado en contexto de atrofia.', category: 'Escamosas' },

  // ============ ESCAMOSAS: ASC-H ============
  { shortcode: '.b3', full_text: 'ASC-H: Células escamosas atípicas, no puede excluirse HSIL.', category: 'Escamosas' },
  { shortcode: '.b3a', full_text: 'ASC-H: Células escamosas atípicas, no puede excluirse HSIL. Se sugiere colposcopía.', category: 'Escamosas' },

  // ============ ESCAMOSAS: LSIL ============
  { shortcode: '.b4', full_text: 'LSIL: Lesión intraepitelial escamosa de bajo grado (VPH / NIC I).', category: 'Escamosas' },
  { shortcode: '.b4a', full_text: 'LSIL: Lesión intraepitelial escamosa de bajo grado con cambios compatibles con VPH.', category: 'Escamosas' },
  { shortcode: '.b4b', full_text: 'LSIL: Lesión intraepitelial escamosa de bajo grado. Se sugiere seguimiento según guías.', category: 'Escamosas' },

  // ============ ESCAMOSAS: HSIL ============
  { shortcode: '.b5', full_text: 'HSIL: Lesión intraepitelial escamosa de alto grado (NIC II / NIC III).', category: 'Escamosas' },
  { shortcode: '.b5a', full_text: 'HSIL: Lesión intraepitelial escamosa de alto grado con sospecha de invasión.', category: 'Escamosas' },
  { shortcode: '.b5b', full_text: 'HSIL: Lesión intraepitelial escamosa de alto grado. Se deriva a colposcopía.', category: 'Escamosas' },

  // ============ ESCAMOSAS: CARCINOMA ============
  { shortcode: '.b6', full_text: 'Carcinoma de células escamosas.', category: 'Escamosas' },
  { shortcode: '.b6a', full_text: 'Carcinoma de células escamosas queratinizante.', category: 'Escamosas' },
  { shortcode: '.b6b', full_text: 'Carcinoma de células escamosas no queratinizante.', category: 'Escamosas' },
  { shortcode: '.b6c', full_text: 'Carcinoma escamocelular microinvasor.', category: 'Escamosas' },

  // ============ GLANDULARES: AGC ============
  { shortcode: '.b7', full_text: 'AGC: Células glandulares atípicas NOS.', category: 'Glandulares' },
  { shortcode: '.b7a', full_text: 'AGC: Células glandulares atípicas, favor neoplásico.', category: 'Glandulares' },
  { shortcode: '.b7b', full_text: 'AGC: Células glandulares atípicas, probable endocervical.', category: 'Glandulares' },
  { shortcode: '.b7c', full_text: 'AGC: Células glandulares atípicas, probable endometrial.', category: 'Glandulares' },

  // ============ GLANDULARES: AIS / ADENOCARCINOMA ============
  { shortcode: '.b8', full_text: 'AIS: Adenocarcinoma in situ endocervical.', category: 'Glandulares' },
  { shortcode: '.b8a', full_text: 'Adenocarcinoma endocervical.', category: 'Glandulares' },
  { shortcode: '.b8b', full_text: 'Adenocarcinoma endometrial.', category: 'Glandulares' },
  { shortcode: '.b8c', full_text: 'Adenocarcinoma extrauterino (metastásico).', category: 'Glandulares' },
  { shortcode: '.b8d', full_text: 'Adenocarcinoma NOS.', category: 'Glandulares' },

  // ============ OTROS NEOPLÁSICOS ============
  { shortcode: '.on1', full_text: 'Células endometriales en mujer ≥45 años.', category: 'Otros' },
  { shortcode: '.on2', full_text: 'Células endometriales atípicas.', category: 'Otros' },
  { shortcode: '.on3', full_text: 'Células endometriales en mujer <45 años (benignas).', category: 'Otros' },
  { shortcode: '.on4', full_text: 'Tumor maligno de origen incierto.', category: 'Otros' },
  { shortcode: '.on5', full_text: 'Metástasis de adenocarcinoma de mama.', category: 'Otros' },
  { shortcode: '.on6', full_text: 'Células compatibles con sarcoma.', category: 'Otros' },
  { shortcode: '.on7', full_text: 'Linfoma / proceso linfoproliferativo (células atípicas linfoides).', category: 'Otros' },
  { shortcode: '.on8', full_text: 'Melanoma metastásico.', category: 'Otros' },

  // ============ INFLAMACIÓN ============
  { shortcode: '.in1', full_text: 'Leucocitos: escasos.', category: 'Inflamación' },
  { shortcode: '.in2', full_text: 'Leucocitos: moderados.', category: 'Inflamación' },
  { shortcode: '.in3', full_text: 'Leucocitos: abundantes (exudado inflamatorio).', category: 'Inflamación' },
  { shortcode: '.in4', full_text: 'Histiocitos presentes.', category: 'Inflamación' },
  { shortcode: '.in5', full_text: 'Células gigantes multinucleadas presentes.', category: 'Inflamación' },
  { shortcode: '.in6', full_text: 'Material proteináceo / detritus celular inflamatorio.', category: 'Inflamación' },
  { shortcode: '.in7', full_text: 'Eritrocitos: escasos (hemorragia leve).', category: 'Inflamación' },
  { shortcode: '.in8', full_text: 'Eritrocitos: abundantes (hemorragia).', category: 'Inflamación' },
  { shortcode: '.in9', full_text: 'Células epiteliales con cambios inflamatorios reactivos.', category: 'Inflamación' },

  // ============ SEGUIMIENTO / RECOMENDACIONES ============
  { shortcode: '.s1', full_text: 'Se sugiere repetir PAP en 1 año según guías de tamizaje.', category: 'Seguimiento' },
  { shortcode: '.s2', full_text: 'Se sugiere repetir PAP en 3 años según guías de tamizaje.', category: 'Seguimiento' },
  { shortcode: '.s3', full_text: 'Se sugiere control citológico a los 6 meses.', category: 'Seguimiento' },
  { shortcode: '.s4', full_text: 'Se sugiere derivación a colposcopía.', category: 'Seguimiento' },
  { shortcode: '.s5', full_text: 'Se sugiere test de VPH de seguimiento en 12 meses.', category: 'Seguimiento' },
  { shortcode: '.s6', full_text: 'Se sugiere test de VPH co-testing.', category: 'Seguimiento' },
  { shortcode: '.s7', full_text: 'Se sugiere biopsia dirigida por colposcopía.', category: 'Seguimiento' },
  { shortcode: '.s8', full_text: 'Se sugiere cono diagnóstico / escisión electroquirúrgica (LEEP / CAF).', category: 'Seguimiento' },
  { shortcode: '.s9', full_text: 'Se sugiere estudio endometrial (biopsia / ecografía).', category: 'Seguimiento' },
  { shortcode: '.s10', full_text: 'Se sugiere tratamiento antibiótico según antibiograma.', category: 'Seguimiento' },
  { shortcode: '.s11', full_text: 'Se sugiere tratamiento antifúngico.', category: 'Seguimiento' },
  { shortcode: '.s12', full_text: 'Se sugiere tratamiento anti-Trichomonas.', category: 'Seguimiento' },
  { shortcode: '.s13', full_text: 'Se sugiere tratamiento hormonal (estrógenos vaginales) y repetir PAP.', category: 'Seguimiento' },
  { shortcode: '.s14', full_text: 'Se sugiere seguimiento clínico. Repetir citología en 6-12 meses.', category: 'Seguimiento' },
  { shortcode: '.s15', full_text: 'Se recomienda repetir muestra por inadecuada.', category: 'Seguimiento' },
  { shortcode: '.s16', full_text: 'Derivar a oncología ginecológica para evaluación y tratamiento.', category: 'Seguimiento' },

  // ============ INMUNOCITOQUÍMICA (p16 / Ki67) ============
  { shortcode: '.iq1', full_text: 'p16 positivo (sobreexpresión nuclear y citoplasmática).', category: 'Inmunocitoquímica' },
  { shortcode: '.iq2', full_text: 'p16 negativo (tinción citoplasmática débil o ausente).', category: 'Inmunocitoquímica' },
  { shortcode: '.iq3', full_text: 'Ki67: índice de proliferación elevado.', category: 'Inmunocitoquímica' },
  { shortcode: '.iq4', full_text: 'Doble tinción p16/Ki67 positiva, sugestivo de transformación oncogénica.', category: 'Inmunocitoquímica' },

  // ============ HALLAZGOS ADICIONALES ============
  { shortcode: '.h1', full_text: 'Células escamosas anucleadas (queratina).', category: 'Hallazgos' },
  { shortcode: '.h2', full_text: 'Células endocervicales presentes.', category: 'Hallazgos' },
  { shortcode: '.h3', full_text: 'Células endometriales presentes.', category: 'Hallazgos' },
  { shortcode: '.h4', full_text: 'Células de metaplasia escamosa presentes.', category: 'Hallazgos' },
  { shortcode: '.h5', full_text: 'Células multinucleadas presentes.', category: 'Hallazgos' },
  { shortcode: '.h6', full_text: 'Cuerpos extraños (restos de DIU, suturas, etc.).', category: 'Hallazgos' },
  { shortcode: '.h7', full_text: 'Espermatozoides presentes.', category: 'Hallazgos' },
  { shortcode: '.h8', full_text: 'Células deciduales (cambios gravídicos).', category: 'Hallazgos' },
  { shortcode: '.h9', full_text: 'Células de epitelio vaginal descamado sin alteraciones.', category: 'Hallazgos' },
  { shortcode: '.h10', full_text: 'Atypia de reparación atípica (AR: atypical repair).', category: 'Hallazgos' },
  { shortcode: '.h11', full_text: 'Cuerpos de psammoma presentes.', category: 'Hallazgos' },
  { shortcode: '.h12', full_text: 'Moco endocervical abundante.', category: 'Hallazgos' },

  // ============ CLASIFICACIÓN GENERAL / CIERRE ============
  { shortcode: '.f1', full_text: 'Resultado dentro de parámetros normales.', category: 'Cierre' },
  { shortcode: '.f2', full_text: 'Resultado anormal: requiere seguimiento.', category: 'Cierre' },
  { shortcode: '.f3', full_text: 'Muestra insuficiente para diagnóstico. Repetir la toma.', category: 'Cierre' },
  { shortcode: '.f4', full_text: 'Evaluación completa. Informe emitido.', category: 'Cierre' },
];

export function searchMacros(query: string, macros: Macro[] = DEFAULT_MACROS): Macro[] {
  if (!query.startsWith('.')) return [];
  return macros.filter(m => m.shortcode.startsWith(query));
}

export function applyMacro(text: string, macro: Macro): string {
  const lines = text.split('\n');
  const lastLine = lines[lines.length - 1] || '';
  if (lastLine.startsWith('.')) {
    lines[lines.length - 1] = macro.full_text;
  } else {
    lines.push(macro.full_text);
  }
  return lines.join('\n');
}
