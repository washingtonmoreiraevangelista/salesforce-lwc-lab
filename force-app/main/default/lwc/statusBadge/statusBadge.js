
import { LightningElement, api } from 'lwc';

export default class StatusBadge extends LightningElement {
    // Recebe o valor do status enviado pela tabela.
    @api value;

    // Retorna o texto que será exibido na etiqueta.
    get valorStatus() {
        return this.value || 'Sem status';
    }

    // Define a cor da etiqueta de acordo com o status.
    get classeStatus() {
        const classes = {
            'Nova': 'status-badge status-nova',
            'Em análise': 'status-badge status-analise',
            'Aprovada': 'status-badge status-aprovada',
            'Rejeitada': 'status-badge status-rejeitada',
            'Cancelada': 'status-badge status-cancelada',
            'Concluída': 'status-badge status-concluida'
        };

        // Aplica uma classe neutra se o status não for reconhecido.
        return classes[this.valorStatus] || 'status-badge status-padrao';
    }
}
