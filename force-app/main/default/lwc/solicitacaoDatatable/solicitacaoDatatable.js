
import LightningDatatable from 'lightning/datatable';

// Importa o componente que exibe os status com cores.
import statusBadgeTemplate from './statusBadgeTemplate.html';

// Cria uma tabela personalizada com um tipo de célula de status.
export default class SolicitacaoDatatable extends LightningDatatable {
    // Registra o tipo personalizado que poderá ser usado nas colunas.
    static customTypes = {
        statusBadge: {
            template: statusBadgeTemplate,
            standardCellLayout: true,
            typeAttributes: ['value']
        }
    };
}
