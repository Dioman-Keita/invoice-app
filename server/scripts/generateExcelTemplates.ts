import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';

async function ensureDir(dir: string) {
	if (!fs.existsSync(dir)) {
		await fs.promises.mkdir(dir, { recursive: true });
	}
}

// Configuration des couleurs CMDT
const COLORS = {
	cmdt_primary: '1E3A8A',      // Bleu marine CMDT
	cmdt_secondary: 'DC2626',    // Rouge CMDT
	cmdt_accent: '059669',       // Vert CMDT
	cmdt_dark: '1F2937',         // Gris foncé
	cmdt_light: 'F8FAFC',        // Gris très clair
	cmdt_warning: 'D97706',      // Orange
	cmdt_success: '10B981',      // Vert succès
	cmdt_gold: 'FFD700',         // Or pour les étoiles
};

async function addCMDTLogo(worksheet: ExcelJS.Worksheet, logoPath: string) {
	try {
	  if (fs.existsSync(logoPath)) {
		const logoImageId = worksheet.workbook.addImage({
		  filename: logoPath,
		  extension: 'png' // <- adapte au fichier .png
		});
  
		// Ancrage simple sans types Anchor compliqués
		worksheet.addImage(logoImageId, 'G1:H3'); // haut-droite
  
		console.log('✅ Logo CMDT intégré avec succès');
	  } else {
		console.log('⚠️  Logo CMDT non trouvé à:', logoPath);
	  }
	} catch (error) {
	  const message = error instanceof Error ? error.message : String(error);
	  console.log('⚠️  Erreur lors du chargement du logo:', message);
	}
  }

async function applyCMDTStyles(worksheet: ExcelJS.Worksheet) {
	// Configuration d'impression professionnelle CMDT sans footer problématique
	worksheet.pageSetup = {
		paperSize: 9, // A4
		orientation: 'landscape',
		fitToPage: true,
		fitToWidth: 1,
		fitToHeight: 1,
		margins: {
			left: 0.5, right: 0.5,
			top: 0.7, bottom: 0.7,
			header: 0.3, footer: 0.3
		}
	};

	worksheet.properties.defaultRowHeight = 25;
}

function applyCenteredAlignment(cell: ExcelJS.Cell) {
	cell.alignment = {
		vertical: 'middle',
		horizontal: 'center',
		wrapText: true
	};
}

async function buildInvoicesTemplate(filePath: string) {
	const wb = new ExcelJS.Workbook();
	const ws = wb.addWorksheet('Facture CMDT');
	
	await applyCMDTStyles(ws);

	// === LOGO CMDT - Position améliorée ===
	const logoPath = path.join(__dirname, '../../common/assets/cmdt_icone.png');
	await addCMDTLogo(ws, logoPath);

	// === EN-TÊTE PRINCIPAL CMDT ===
	ws.mergeCells('A1:H3');
	const mainHeader = ws.getCell('A1');
	mainHeader.value = 'CMDT - GESTION DES FACTURES';
	mainHeader.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: COLORS.cmdt_primary }
	};
	mainHeader.font = {
		color: { argb: 'FFFFFF' },
		bold: true,
		size: 18,
		name: 'Arial'
	};
	applyCenteredAlignment(mainHeader);

	// === SOUS-TITRE CMDT ===
	ws.mergeCells('A4:H4');
	const subHeader = ws.getCell('A4');
	subHeader.value = 'SUIVI ET VALIDATION DES COMMANDES';
	subHeader.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: COLORS.cmdt_secondary }
	};
	subHeader.font = {
		color: { argb: 'FFFFFF' },
		bold: true,
		size: 12,
		name: 'Arial'
	};
	applyCenteredAlignment(subHeader);

	// === EN-TÊTES DE COLONNES ===
	const headers = [
		'Référence CMDT', 'Numéro Commande', 'Numéro Facture', 
		'Fournisseur', 'Date Arrivée', 'Montant (FCFA)', 
		'Statut CMDT', 'Actions'
	];
	
	const headerRow = ws.getRow(5);
	headerRow.height = 35;
	headers.forEach((header, index) => {
		const cell = headerRow.getCell(index + 1);
		cell.value = header;
		cell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: COLORS.cmdt_dark }
		};
		cell.font = {
			color: { argb: 'FFFFFF' },
			bold: true,
			size: 11,
			name: 'Arial'
		};
		applyCenteredAlignment(cell);
		cell.border = {
			top: { style: 'medium', color: { argb: 'FFFFFF' } },
			left: { style: 'medium', color: { argb: 'FFFFFF' } },
			bottom: { style: 'medium', color: { argb: 'FFFFFF' } },
			right: { style: 'medium', color: { argb: 'FFFFFF' } }
		};
	});

	// === DONNÉES EXEMPLE ===
	const dataRows = [
		['CMDT-FAC-001', 'CMD-24001', 'FAC-2024-001', 'SARL Tech Solutions', '15/01/2024', '1.250.000', 'APPROUVÉ', '📊 📋 ✏️'],
		['CMDT-FAC-002', 'CMD-24002', 'FAC-2024-002', 'Global Import', '18/01/2024', '875.500', 'EN ATTENTE', '📊 📋 ✏️'],
		['CMDT-FAC-003', 'CMD-24003', 'FAC-2024-003', 'Electro Pro', '20/01/2024', '2.150.000', 'APPROUVÉ', '📊 📋 ✏️'],
		['CMDT-FAC-004', 'CMD-24004', 'FAC-2024-004', 'Office Supply Co', '22/01/2024', '450.000', 'REJETÉ', '📊 📋 ✏️']
	];

	dataRows.forEach((rowData, rowIndex) => {
		const row = ws.getRow(6 + rowIndex);
		row.height = 28;
		
		rowData.forEach((cellData, cellIndex) => {
			const cell = row.getCell(cellIndex + 1);
			cell.value = cellData;
			cell.font = {
				size: 10,
				name: 'Arial',
			};
			applyCenteredAlignment(cell);
			cell.border = {
				top: { style: 'thin', color: { argb: 'D1D5DB' } },
				left: { style: 'thin', color: { argb: 'D1D5DB' } },
				bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
				right: { style: 'thin', color: { argb: 'D1D5DB' } }
			};

			// Alternance de couleurs de lignes
			if (rowIndex % 2 === 0) {
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'F8FAFC' }
				};
			}

			// Style spécial pour la colonne Statut CMDT
			if (cellIndex === 6) {
				cell.font.bold = true;
				if (cellData === 'APPROUVÉ') {
					cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.cmdt_success } };
					cell.font.color = { argb: 'FFFFFF' };
				} else if (cellData === 'EN ATTENTE') {
					cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.cmdt_warning } };
					cell.font.color = { argb: 'FFFFFF' };
				} else if (cellData === 'REJETÉ') {
					cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.cmdt_secondary } };
					cell.font.color = { argb: 'FFFFFF' };
				}
			}

			// Style pour la colonne Montant
			if (cellIndex === 5) {
				cell.font.bold = true;
				cell.numFmt = '#,##0';
			}
		});
	});

	// === SECTION SYNTHÈSE CMDT ===
	const summaryStartRow = 11;
	ws.mergeCells(`A${summaryStartRow}:H${summaryStartRow}`);
	const summaryHeader = ws.getCell(`A${summaryStartRow}`);
	summaryHeader.value = 'SYNTHÈSE CMDT - INDICATEURS CLÉS';
	summaryHeader.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: COLORS.cmdt_primary }
	};
	summaryHeader.font = { 
		color: { argb: 'FFFFFF' }, 
		bold: true, 
		size: 12 
	};
	applyCenteredAlignment(summaryHeader);
	
	const summaryData = [
		{ label: 'TOTAL COMMANDES', value: '4' },
		{ label: 'MONTANT GLOBAL', value: '4.725.500 FCFA' },
		{ label: 'TAUX APPROBATION', value: '75%' }
	];

	summaryData.forEach((item, index) => {
		const row = ws.getRow(summaryStartRow + 1 + index);
		row.height = 28;
		
		// Fusionner pour chaque indicateur (2 colonnes par indicateur)
		ws.mergeCells(`A${summaryStartRow + 1 + index}:D${summaryStartRow + 1 + index}`);
		ws.mergeCells(`E${summaryStartRow + 1 + index}:H${summaryStartRow + 1 + index}`);
		
		// Label
		const labelCell = row.getCell(1);
		labelCell.value = item.label;
		labelCell.font = { bold: true, size: 11 };
		applyCenteredAlignment(labelCell);
		labelCell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'F0F9FF' }
		};
		
		// Valeur
		const valueCell = row.getCell(5);
		valueCell.value = item.value;
		valueCell.font = { bold: true, size: 11, color: { argb: COLORS.cmdt_primary } };
		applyCenteredAlignment(valueCell);
		valueCell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFFFFF' }
		};

		// Bordures
		[labelCell, valueCell].forEach(cell => {
			cell.border = {
				top: { style: 'medium', color: { argb: COLORS.cmdt_primary } },
				left: { style: 'medium', color: { argb: COLORS.cmdt_primary } },
				bottom: { style: 'medium', color: { argb: COLORS.cmdt_primary } },
				right: { style: 'medium', color: { argb: COLORS.cmdt_primary } }
			};
		});
	});

	// === CONFIGURATION DES COLONNES ===
	ws.columns = [
		{ width: 16 }, { width: 18 }, { width: 18 }, 
		{ width: 24 }, { width: 14 }, { width: 16 }, 
		{ width: 16 }, { width: 12 }
	];

	// === GEL DES VOLETS ===
	ws.views = [{ state: 'frozen', ySplit: 4 }];

	await wb.xlsx.writeFile(filePath);
}

async function buildSuppliersTemplate(filePath: string) {
	const wb = new ExcelJS.Workbook();
	const ws = wb.addWorksheet('Fournisseurs CMDT');
	
	await applyCMDTStyles(ws);

	// === LOGO CMDT ===
	const logoPath = path.join(__dirname, '../../common/assets/cmdt_icone.png');
	await addCMDTLogo(ws, logoPath);

	// === EN-TÊTE PRINCIPAL CMDT ===
	ws.mergeCells('A1:F3');
	const mainHeader = ws.getCell('A1');
	mainHeader.value = 'CMDT - RÉPERTOIRE FOURNISSEURS';
	mainHeader.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: COLORS.cmdt_primary }
	};
	mainHeader.font = {
		color: { argb: 'FFFFFF' },
		bold: true,
		size: 18,
		name: 'Arial'
	};
	applyCenteredAlignment(mainHeader);

	// === EN-TÊTES DE COLONNES ===
	const headers = [
		'ID CMDT', 'Nom Fournisseur', 'Compte Bancaire', 
		'Téléphone', 'Date Partenariat', 'Statut CMDT'
	];
	
	const headerRow = ws.getRow(5);
	headerRow.height = 35;
	headers.forEach((header, index) => {
		const cell = headerRow.getCell(index + 1);
		cell.value = header;
		cell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: COLORS.cmdt_dark }
		};
		cell.font = {
			color: { argb: 'FFFFFF' },
			bold: true,
			size: 11,
			name: 'Arial'
		};
		applyCenteredAlignment(cell);
		cell.border = {
			top: { style: 'medium', color: { argb: 'FFFFFF' } },
			left: { style: 'medium', color: { argb: 'FFFFFF' } },
			bottom: { style: 'medium', color: { argb: 'FFFFFF' } },
			right: { style: 'medium', color: { argb: 'FFFFFF' } }
		};
	});

	// === DONNÉES EXEMPLE ===
	const dataRows = [
		['CMDT-FRN-001', 'SARL Tech Solutions', 'FR7630001007941234567890185', '+33 1 45 67 89 10', '15/01/2023', 'ACTIF'],
		['CMDT-FRN-002', 'Global Import', 'FR7630002007941234567890186', '+33 1 46 78 90 12', '20/02/2023', 'ACTIF'],
		['CMDT-FRN-003', 'Electro Pro', 'FR7630003007941234567890187', '+33 1 47 89 01 23', '10/03/2023', 'ACTIF'],
		['CMDT-FRN-004', 'Office Supply Co', 'FR7630004007941234567890188', '+33 1 48 90 12 34', '05/04/2023', 'INACTIF']
	];

	dataRows.forEach((rowData, rowIndex) => {
		const row = ws.getRow(6 + rowIndex);
		row.height = 28;
		
		rowData.forEach((cellData, cellIndex) => {
			const cell = row.getCell(cellIndex + 1);
			cell.value = cellData;
			cell.font = { size: 10, name: 'Arial' };
			applyCenteredAlignment(cell);
			cell.border = {
				top: { style: 'thin', color: { argb: 'D1D5DB' } },
				left: { style: 'thin', color: { argb: 'D1D5DB' } },
				bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
				right: { style: 'thin', color: { argb: 'D1D5DB' } }
			};

			if (rowIndex % 2 === 0) {
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'F8FAFC' }
				};
			}

			// Style pour la colonne Statut CMDT
			if (cellIndex === 5) {
				cell.font.bold = true;
				if (cellData === 'ACTIF') {
					cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.cmdt_success } };
					cell.font.color = { argb: 'FFFFFF' };
				} else {
					cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.cmdt_secondary } };
					cell.font.color = { argb: 'FFFFFF' };
				}
			}
		});
	});

	// === SECTION INDICATEURS CMDT ===
	const indicatorsStartRow = 11;
	ws.mergeCells(`A${indicatorsStartRow}:F${indicatorsStartRow}`);
	const indicatorsHeader = ws.getCell(`A${indicatorsStartRow}`);
	indicatorsHeader.value = 'INDICATEURS PARTENAIRES CMDT';
	indicatorsHeader.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: COLORS.cmdt_primary }
	};
	indicatorsHeader.font = { color: { argb: 'FFFFFF' }, bold: true, size: 12 };
	applyCenteredAlignment(indicatorsHeader);

	const indicatorsData = [
		{ label: 'PARTENAIRES ACTIFS', value: '3/4' },
		{ label: 'TAUX ACTIVITÉ', value: '75%' },
		{ label: 'ANCIENNETÉ MOYENNE', value: '8 MOIS' }
	];

	indicatorsData.forEach((item, index) => {
		const row = ws.getRow(indicatorsStartRow + 1 + index);
		row.height = 28;
		
		// Fusionner pour chaque indicateur
		ws.mergeCells(`A${indicatorsStartRow + 1 + index}:C${indicatorsStartRow + 1 + index}`);
		ws.mergeCells(`D${indicatorsStartRow + 1 + index}:F${indicatorsStartRow + 1 + index}`);
		
		// Label
		const labelCell = row.getCell(1);
		labelCell.value = item.label;
		labelCell.font = { bold: true, size: 11 };
		applyCenteredAlignment(labelCell);
		labelCell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'F0F9FF' }
		};
		
		// Valeur
		const valueCell = row.getCell(4);
		valueCell.value = item.value;
		valueCell.font = { bold: true, size: 11, color: { argb: COLORS.cmdt_primary } };
		applyCenteredAlignment(valueCell);
		valueCell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFFFFF' }
		};

		// Bordures
		[labelCell, valueCell].forEach(cell => {
			cell.border = {
				top: { style: 'medium', color: { argb: COLORS.cmdt_primary } },
				left: { style: 'medium', color: { argb: COLORS.cmdt_primary } },
				bottom: { style: 'medium', color: { argb: COLORS.cmdt_primary } },
				right: { style: 'medium', color: { argb: COLORS.cmdt_primary } }
			};
		});
	});

	// === CONFIGURATION DES COLONNES ===
	ws.columns = [
		{ width: 14 }, { width: 26 }, { width: 28 }, 
		{ width: 16 }, { width: 18 }, { width: 14 }
	];

	// === GEL DES VOLETS ===
	ws.views = [{ state: 'frozen', ySplit: 4 }];

	await wb.xlsx.writeFile(filePath);
}

async function buildRelationalTemplate(filePath: string) {
	const wb = new ExcelJS.Workbook();
	const ws = wb.addWorksheet('Dashboard CMDT');
	
	await applyCMDTStyles(ws);

	// === LOGO CMDT ===
	const logoPath = path.join(__dirname, '../../common/assets/cmdt_icone.png');
	await addCMDTLogo(ws, logoPath);

	// === EN-TÊTE PRINCIPAL CMDT ===
	ws.mergeCells('A1:G3');
	const mainHeader = ws.getCell('A1');
	mainHeader.value = 'CMDT - DASHBOARD PERFORMANCE';
	mainHeader.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: COLORS.cmdt_primary }
	};
	mainHeader.font = {
		color: { argb: 'FFFFFF' },
		bold: true,
		size: 18,
		name: 'Arial'
	};
	applyCenteredAlignment(mainHeader);

	// === SECTION KPI CMDT ===
	ws.mergeCells('A5:G5');
	const kpiHeader = ws.getCell('A5');
	kpiHeader.value = 'TABLEAU DE BORD CMDT - INDICATEURS CLÉS';
	kpiHeader.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: COLORS.cmdt_secondary }
	};
	kpiHeader.font = {
		color: { argb: 'FFFFFF' },
		bold: true,
		size: 14,
		name: 'Arial'
	};
	applyCenteredAlignment(kpiHeader);

	const kpiData = [
		{ label: 'COMMANDES TRAITÉES', value: '24', trend: '↗ +20%' },
		{ label: 'CHIFFRE AFFAIRES', value: '18.75M FCFA', trend: '↗ +15%' },
		{ label: 'FOURNISSEURS ACTIFS', value: '4/5', trend: '→ STABLE' }
	];

	kpiData.forEach((kpi, index) => {
		const row = ws.getRow(6 + index);
		row.height = 32;
		
		// Fusionner les cellules pour chaque KPI
		ws.mergeCells(`A${6 + index}:G${6 + index}`);
		
		const cell = ws.getCell(`A${6 + index}`);
		cell.value = `${kpi.label}   |   ${kpi.value}   |   ${kpi.trend}`;
		cell.font = { bold: true, size: 12, name: 'Arial' };
		applyCenteredAlignment(cell);
		cell.border = {
			top: { style: 'medium', color: { argb: COLORS.cmdt_primary } },
			left: { style: 'medium', color: { argb: COLORS.cmdt_primary } },
			bottom: { style: 'medium', color: { argb: COLORS.cmdt_primary } },
			right: { style: 'medium', color: { argb: COLORS.cmdt_primary } }
		};
		
		cell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: index === 0 ? 'F0F9FF' : index === 1 ? 'F0FDF4' : 'FEFCE8' }
		};
	});

	// === EN-TÊTES TABLEAU DÉTAILLÉ ===
	const headers = [
		'PARTENAIRE CMDT', 'COMPTE', 'NBR COMMANDES', 
		'TOTAL (FCFA)', 'MOYENNE (FCFA)', 'DERNIÈRE CMD', 'PERFORMANCE'
	];
	
	const headerRow = ws.getRow(10);
	headerRow.height = 35;
	headers.forEach((header, index) => {
		const cell = headerRow.getCell(index + 1);
		cell.value = header;
		cell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: COLORS.cmdt_dark }
		};
		cell.font = {
			color: { argb: 'FFFFFF' },
			bold: true,
			size: 11,
			name: 'Arial'
		};
		applyCenteredAlignment(cell);
		cell.border = {
			top: { style: 'medium', color: { argb: 'FFFFFF' } },
			left: { style: 'medium', color: { argb: 'FFFFFF' } },
			bottom: { style: 'medium', color: { argb: 'FFFFFF' } },
			right: { style: 'medium', color: { argb: 'FFFFFF' } }
		};
	});

	// === DONNÉES DÉTAILLÉES ===
	const detailedData = [
		['SARL Tech Solutions', 'FR763000100794...', '8', '6.250.000', '781.250', '15/01/2024', '★★★★★'],
		['Global Import', 'FR763000200794...', '6', '4.125.500', '687.583', '18/01/2024', '★★★★'],
		['Electro Pro', 'FR763000300794...', '5', '5.875.900', '1.175.180', '20/01/2024', '★★★★★'],
		['Office Supply Co', 'FR763000400794...', '3', '1.250.000', '416.667', '22/01/2024', '★★★']
	];

	detailedData.forEach((rowData, rowIndex) => {
		const row = ws.getRow(11 + rowIndex);
		row.height = 28;
		
		rowData.forEach((cellData, cellIndex) => {
			const cell = row.getCell(cellIndex + 1);
			cell.value = cellData;
			cell.font = { size: 10, name: 'Arial' };
			applyCenteredAlignment(cell);
			cell.border = {
				top: { style: 'thin', color: { argb: 'D1D5DB' } },
				left: { style: 'thin', color: { argb: 'D1D5DB' } },
				bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
				right: { style: 'thin', color: { argb: 'D1D5DB' } }
			};

			if (rowIndex % 2 === 0) {
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'F8FAFC' }
				};
			}

			// Style pour la colonne Performance avec étoiles jaunes
			if (cellIndex === 6) {
				cell.font = { 
					bold: true, 
					size: 12, 
					color: { argb: COLORS.cmdt_gold },
					name: 'Arial'
				};
				// Fond coloré selon la performance
				if (cellData === '★★★★★') {
					cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0FDF4' } };
				} else if (cellData === '★★★★') {
					cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEFCE8' } };
				} else {
					cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } };
				}
			}

			// Style pour les colonnes numériques
			if (cellIndex === 3 || cellIndex === 4) {
				cell.font.bold = true;
				if (cellIndex === 4) {
					cell.numFmt = '#,##0';
				}
			}
		});
	});

	// === CONFIGURATION DES COLONNES ===
	ws.columns = [
		{ width: 22 }, { width: 18 }, { width: 14 }, 
		{ width: 16 }, { width: 16 }, { width: 14 }, 
		{ width: 14 }
	];

	// === GEL DES VOLETS ===
	ws.views = [{ state: 'frozen', ySplit: 4 }];

	await wb.xlsx.writeFile(filePath);
}

async function main() {
	const tplDir = path.join(__dirname, '../../common/templates/excel');
	await ensureDir(tplDir);

	console.log('🔄 Génération des modèles Excel CMDT professionnels...');
	
	await buildInvoicesTemplate(path.join(tplDir, 'invoices.xlsx'));
	console.log('✅ invoices.xlsx créé - Design CMDT professionnel');
	
	await buildSuppliersTemplate(path.join(tplDir, 'suppliers.xlsx'));
	console.log('✅ suppliers.xlsx créé - Design CMDT professionnel');
	
	await buildRelationalTemplate(path.join(tplDir, 'relational.xlsx'));
	console.log('✅ relational.xlsx créé - Design CMDT professionnel');
	
	console.log('\n🎉 MODÈLES CMDT GÉNÉRÉS AVEC SUCCÈS');
	console.log('📁 Dossier:', tplDir);
	console.log('\n✨ Améliorations apportées:');
	console.log('   ✅ Logo CMDT mieux positionné');
	console.log('   ✅ Centrage parfait de tout le contenu');
	console.log('   ✅ Étoiles jaunes pour la performance');
	console.log('   ✅ Footer problématique supprimé');
	console.log('   ✅ Design entièrement centré sur CMDT');
}

main().catch((error) => {
	console.error('❌ Erreur lors de la génération des modèles CMDT:', error);
	process.exit(1);
});