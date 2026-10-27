// Importa a classe base padrão dos componentes Lightning.
import { LightningElement } from 'lwc';

import usuarioEhResponsavel from '@salesforce/apex/SolicitacaoController.usuarioEhResponsavel';

// Importa o recurso do Salesforce que exibe mensagens na tela.
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// Importa os métodos Apex responsáveis pelas operações no Salesforce.
import buscarSolicitacoes from '@salesforce/apex/SolicitacaoController.buscarSolicitacoes';
import criarSolicitacao from '@salesforce/apex/SolicitacaoController.criarSolicitacao';
import atualizarSolicitacao from '@salesforce/apex/SolicitacaoController.atualizarSolicitacao';
import excluirSolicitacao from '@salesforce/apex/SolicitacaoController.excluirSolicitacao';
import cancelarSolicitacao from '@salesforce/apex/SolicitacaoController.cancelarSolicitacao';
import buscarResponsaveis from '@salesforce/apex/SolicitacaoController.buscarResponsaveis';

// Importa o método Apex que calcula os indicadores do painel.
import buscarIndicadores from '@salesforce/apex/SolicitacaoController.buscarIndicadores';




export default class SolicitacaoManager extends LightningElement {

    // Armazena o texto digitado na pesquisa.
    termoPesquisa = '';

    ehResponsavel = false;
    get camposSomenteLeitura() {
    return !this.ehResponsavel;
}

    // Armazena o status selecionado no filtro.
filtroStatus = '';

// Armazena a prioridade selecionada no filtro.
filtroPrioridade = '';

// Define as opções disponíveis para filtrar por status.
opcoesFiltroStatus = [
    { label: 'Todos os status', value: '' },
    { label: 'Nova', value: 'Nova' },
    { label: 'Em análise', value: 'Em análise' },
    { label: 'Aprovada', value: 'Aprovada' },
    { label: 'Rejeitada', value: 'Rejeitada' },
    { label: 'Cancelada', value: 'Cancelada' },
    { label: 'Concluída', value: 'Concluída' }
];

// Define as opções disponíveis para filtrar por prioridade.
opcoesFiltroPrioridade = [
    { label: 'Todas as prioridades', value: '' },
    { label: 'Baixa', value: 'Baixa' },
    { label: 'Média', value: 'Média' },
    { label: 'Alta', value: 'Alta' },
    { label: 'Urgente', value: 'Urgente' }
];

    // Armazena a lista de solicitações retornadas pelo Apex.
    solicitacoes = [];

    // Guarda informações de erro para tratamento e exibição.
    erro;

    // Controla o estado do botão enquanto uma operação é executada.
    salvando = false;

    // Armazena uma mensagem de sucesso, quando necessária.
    mensagemSucesso = '';

    // Guarda os valores preenchidos no formulário.
    nome = '';
    categoria = '';
    prioridade = 'Média';
    descricao = '';
    responsavelId = '';
    dataLimite = '';
    valor = null;
    justificativa = '';

    // Controla a exibição da confirmação de exclusão.
    mostrarConfirmacaoExclusao = false;

    // Guarda o ID da solicitação que será excluída.
    solicitacaoParaExcluirId;

    // Guarda o nome da solicitação exibido na confirmação.
    nomeSolicitacaoExclusao = '';

    // Indica se a exclusão está em andamento.
    excluindo = false;

    // Controla a exibição do modal de confirmação de cancelamento.
    mostrarConfirmacaoCancelamento = false;

    // Guarda o ID da solicitação que será cancelada.
    solicitacaoParaCancelarId;

    // Guarda o nome da solicitação exibido na confirmação.
    nomeSolicitacaoCancelamento = '';

    // Indica se o cancelamento está em andamento.
    cancelando = false;

    // Armazena as opções de usuários disponíveis no campo Responsável.
    opcoesResponsavel = [];

    // Termo utilizado para pesquisar os responsáveis.
    termoResponsavel = '';

    // Controla a abertura e o fechamento do formulário.
    mostrarFormulario = false;

    // Indica se o formulário está criando ou editando uma solicitação.
    modoEdicao = false;

    

    // Armazena o ID do registro que está sendo editado.
    solicitacaoSelecionadaId;

// Armazena a lista de solicitações retornadas pelo Apex.
solicitacoes = [];

// Armazena os indicadores apresentados no painel.
indicadores = {
    total: 0,
    pendentes: 0,
    urgentes: 0,
    aprovadas: 0,
    canceladas: 0
};

// Indica se os indicadores estão sendo carregados.
carregandoIndicadores = false;


    // Define as colunas e as ações disponíveis na tabela.

colunas = [
    {
        label: 'Nome',
        fieldName: 'Name'
    },
    {
        label: 'Status',
        fieldName: 'Status__c',
        type: 'statusBadge',
        typeAttributes: {
            value: { fieldName: 'Status__c' }
        }
    },
    {
        label: 'Prioridade',
        fieldName: 'Prioridade__c'
    },
    {
        label: 'Categoria',
        fieldName: 'Categoria__c'
    },
    {
        label: 'Data Limite',
        fieldName: 'Data_Limite__c',
        type: 'date'
    },
    {
        label: 'Valor',
        fieldName: 'Valor__c',
        type: 'currency'
    },
    {
        type: 'action',
        typeAttributes: {
            rowActions: (row, doneCallback) => {
                const acoes = [
                    {
                        label: 'Cancelar solicitação',
                        name: 'cancelar',
                        iconName: 'utility:close'
                    }
                ];

                if (this.ehResponsavel) {
                    acoes.unshift({
                        label: 'Editar',
                        name: 'editar',
                        iconName: 'utility:edit'
                    });

                    acoes.push({
                        label: 'Excluir definitivamente',
                        name: 'excluir',
                        iconName: 'utility:delete'
                    });
                }

                doneCallback(acoes);
            }
        }
    }
];

    // Define as categorias disponíveis no formulário.
    opcoesCategoria = [
        { label: 'Tecnologia', value: 'Tecnologia' },
        { label: 'Compras', value: 'Compras' },
        { label: 'Financeiro', value: 'Financeiro' },
        { label: 'Manutenção', value: 'Manutenção' },
        { label: 'Administrativo', value: 'Administrativo' },
        { label: 'Outros', value: 'Outros' }
    ];

    // Define as prioridades que podem ser selecionadas.
    opcoesPrioridade = [
        { label: 'Baixa', value: 'Baixa' },
        { label: 'Média', value: 'Média' },
        { label: 'Alta', value: 'Alta' },
        { label: 'Urgente', value: 'Urgente' }
    ];

    // Executa automaticamente quando o componente é inicializado.
    // Carrega as solicitações e os usuários responsáveis.

async connectedCallback() {
    await this.verificarPerfil();
    await this.carregarSolicitacoes();
    await this.carregarResponsaveis();

    if (this.ehResponsavel) {
        await this.carregarIndicadores();
    }
}


    // Define o título do formulário conforme a operação atual.
    get tituloFormulario() {
        return this.modoEdicao
            ? 'Editar Solicitação'
            : 'Nova Solicitação';
    }

    // Define o texto do botão de salvamento conforme a operação.
    get textoBotaoSalvar() {
        return this.modoEdicao
            ? 'Salvar alterações'
            : 'Salvar solicitação';
    }

    // Exibe uma notificação padrão do Salesforce.
    // A variante pode ser success, error, warning ou info.
    notificar(titulo, mensagem, variante) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: titulo,
                message: mensagem,
                variant: variante
            })
        );
    }

    // Prepara o formulário para cadastrar uma nova solicitação.
    handleNovaSolicitacao() {
        this.limparFormulario();
        this.modoEdicao = false;
        this.solicitacaoSelecionadaId = undefined;
        this.erro = undefined;
        this.mensagemSucesso = '';
        this.mostrarFormulario = true;
    }

    // Fecha o formulário quando não há salvamento em andamento.
    handleFecharModal() {
        if (!this.salvando) {
            this.mostrarFormulario = false;
            this.erro = undefined;
            this.mensagemSucesso = '';
        }
    }

    // Atualiza o termo de pesquisa e consulta as solicitações.
    handleSearch(event) {
        this.termoPesquisa = event.target.value;
        this.carregarSolicitacoes();
    }

    // Atualiza o filtro quando o status é alterado.
handleFiltroStatus(event) {
    this.filtroStatus = event.detail.value;
    this.aplicarFiltros();
}

// Atualiza o filtro quando a prioridade é alterada.
handleFiltroPrioridade(event) {
    this.filtroPrioridade = event.detail.value;
    this.aplicarFiltros();
}

// Aplica os filtros selecionados às solicitações.
aplicarFiltros() {
    this.carregarSolicitacoes();
}

    
    // Consulta as solicitações e aplica os filtros selecionados.
    async carregarSolicitacoes() {
        try {
            // Busca os registros pelo nome informado.
            const resultado = await buscarSolicitacoes({
                termoPesquisa: this.termoPesquisa.trim()
            });

            // Filtra os registros pelo status e pela prioridade.
            this.solicitacoes = resultado.filter((registro) => {
                const statusCorresponde =
                    !this.filtroStatus ||
                    registro.Status__c === this.filtroStatus;

                const prioridadeCorresponde =
                    !this.filtroPrioridade ||
                    registro.Prioridade__c === this.filtroPrioridade;

                return statusCorresponde && prioridadeCorresponde;
            });

            // Limpa o erro anterior quando a consulta funciona.
            this.erro = undefined;
        } catch (error) {
            // Limpa a tabela e registra o erro em caso de falha.
            this.erro = error;
            this.solicitacoes = [];

            this.notificar(
                'Erro ao carregar',
                this.mensagemErro(error),
                'error'
            );
        }

    }

    // Verifica se o usuário atual possui o perfil de responsável.
    async verificarPerfil() {
    try {
        this.ehResponsavel = await usuarioEhResponsavel();
    } catch (error) {
        this.ehResponsavel = false;
        console.error('Erro ao verificar perfil:', error);
    }
}


    // Consulta o Apex para atualizar os indicadores do painel.
async carregarIndicadores() {
    this.carregandoIndicadores = true;

    try {
        this.indicadores = await buscarIndicadores();
    } catch (error) {
        this.notificar(
            'Erro ao carregar indicadores',
            this.mensagemErro(error),
            'error'
        );
    } finally {
        this.carregandoIndicadores = false;
    }
}

    // Atualiza a variável correspondente ao campo alterado.

handleInputChange(event) {
    const campo = event.target.name;
    const valor = event.detail?.value ?? event.target.value;

    this[campo] = valor;

    if (campo === 'categoria') {
            const regras = {
    Tecnologia: { prioridade: 'Urgente', dias: 1 },
    Compras: { prioridade: 'Média', dias: 5 },
    Financeiro: { prioridade: 'Alta', dias: 2 },
    Manutenção: { prioridade: 'Alta', dias: 2 },
    Administrativo: { prioridade: 'Baixa', dias: 5 },
    Outros: { prioridade: 'Média', dias: 3 }
};

        const regra = regras[valor];

        if (regra) {
            this.prioridade = regra.prioridade;

            const data = new Date();
            data.setHours(12, 0, 0, 0);

            let diasAdicionados = 0;

            while (diasAdicionados < regra.dias) {
                data.setDate(data.getDate() + 1);

                const diaSemana = data.getDay();

                if (diaSemana !== 0 && diaSemana !== 6) {
                    diasAdicionados++;
                }
            }

            const ano = data.getFullYear();
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const dia = String(data.getDate()).padStart(2, '0');

            this.dataLimite = `${ano}-${mes}-${dia}`;
        }
    }
}


    // Identifica qual ação foi escolhida na linha da tabela.
    handleRowAction(event) {
        const acao = event.detail.action.name;
        const registro = event.detail.row;

        // Abre o formulário para editar a solicitação.
        if (acao === 'editar') {
            this.editarSolicitacao(registro);
        }

        // Abre a confirmação de cancelamento.
        if (acao === 'cancelar') {
            this.confirmarCancelamento(registro);
        }

        // Abre a confirmação de exclusão definitiva.
        if (acao === 'excluir') {
            this.confirmarExclusao(registro);
        }
    }

    // Preenche o formulário com os dados da solicitação selecionada.
    editarSolicitacao(registro) {
        this.limparFormulario();

        // Guarda o ID necessário para atualizar o registro correto.
        this.solicitacaoSelecionadaId = registro.Id;

        // Copia os valores existentes para as variáveis do formulário.
        this.nome = registro.Name || '';
        this.categoria = registro.Categoria__c || '';
        this.prioridade = registro.Prioridade__c || 'Média';
        this.descricao = registro.Descri_o__c || '';
        this.responsavelId = registro.Respons_vel__c || '';
        this.dataLimite = registro.Data_Limite__c || '';
        this.valor = registro.Valor__c ?? null;
        this.justificativa = registro.Justificativa__c || '';

        // Ativa o modo de edição e abre o formulário.
        this.modoEdicao = true;
        this.erro = undefined;
        this.mensagemSucesso = '';
        this.mostrarFormulario = true;
    }

    // Abre a confirmação e guarda os dados da solicitação selecionada.
    confirmarCancelamento(registro) {
        // Guarda o ID do registro que será cancelado.
        this.solicitacaoParaCancelarId = registro.Id;

        // Guarda o nome para identificar a solicitação na confirmação.
        this.nomeSolicitacaoCancelamento = registro.Name;

        // Exibe o modal de confirmação de cancelamento.
        this.mostrarConfirmacaoCancelamento = true;
    }

    // Fecha a confirmação sem alterar o registro.
    handleCancelarCancelamento() {
        // Fecha o modal somente se não houver cancelamento em andamento.
        if (!this.cancelando) {
            this.mostrarConfirmacaoCancelamento = false;
            this.solicitacaoParaCancelarId = undefined;
            this.nomeSolicitacaoCancelamento = '';
        }
    }

    
// Confirma o cancelamento e atualiza a tabela imediatamente.
async handleConfirmarCancelamento() {
    if (this.cancelando || !this.solicitacaoParaCancelarId) {
        return;
    }

    const idCancelado = this.solicitacaoParaCancelarId;
    this.cancelando = true;

    try {
        await cancelarSolicitacao({
            solicitacaoId: idCancelado
        });

        // Atualiza a lista imediatamente.
        await this.carregarSolicitacoes();

        // Só consulta indicadores se o usuário for responsável.
        if (this.ehResponsavel) {
            await this.carregarIndicadores();
        }

        // Fecha o modal.
        this.mostrarConfirmacaoCancelamento = false;
        this.solicitacaoParaCancelarId = undefined;
        this.nomeSolicitacaoCancelamento = '';

        this.notificar(
            'Solicitação cancelada',
            'O status foi alterado para Cancelada.',
            'success'
        );

    } catch (error) {
        this.notificar(
            'Erro ao cancelar',
            this.mensagemErro(error),
            'error'
        );
    } finally {
        this.cancelando = false;
    }
}

   
    // Abre o modal de confirmação de exclusão.
    confirmarExclusao(registro) {
        // Guarda os dados do registro que será excluído.
        this.solicitacaoParaExcluirId = registro.Id;
        this.nomeSolicitacaoExclusao = registro.Name;
        this.mostrarConfirmacaoExclusao = true;
    }

    // Fecha o modal sem excluir a solicitação.
    handleCancelarExclusao() {
        if (!this.excluindo) {
            this.mostrarConfirmacaoExclusao = false;
            this.solicitacaoParaExcluirId = undefined;
            this.nomeSolicitacaoExclusao = '';
        }
    }

    // Exclui a solicitação após a confirmação do usuário.
    async handleConfirmarExclusao() {
        // Evita iniciar outra exclusão enquanto existe uma em andamento.
        if (this.excluindo || !this.solicitacaoParaExcluirId) {
            return;
        }

        // Indica que a exclusão começou.
        this.excluindo = true;

        try {
            // Envia o ID do registro ao método Apex.
            await excluirSolicitacao({
                solicitacaoId: this.solicitacaoParaExcluirId
            });

            // Fecha o modal após a exclusão bem-sucedida.
            this.mostrarConfirmacaoExclusao = false;

            // Limpa os dados temporários da confirmação.
            this.solicitacaoParaExcluirId = undefined;
            this.nomeSolicitacaoExclusao = '';

            // Informa que a exclusão foi concluída.
            this.notificar(
                'Exclusão concluída',
                'Solicitação excluída com sucesso.',
                'success'
            );

            // Atualiza a tabela sem recarregar a página.
            await this.carregarSolicitacoes();
        } catch (error) {
            // Mantém a confirmação aberta caso ocorra um erro.
            this.notificar(
                'Erro ao excluir',
                this.mensagemErro(error),
                'error'
            );
        } finally {
            // Libera o botão ao terminar a operação.
            this.excluindo = false;
        }
    }

    // Valida os campos e executa o cadastro ou a atualização.
    async handleSalvar() {
        // Obtém os campos do formulário que possuem atributo name.
        const campos = [
            ...this.template.querySelectorAll(
                'lightning-input, lightning-combobox, lightning-textarea'
            )
        ].filter(campo => campo.name);

        // Verifica a validade de todos os campos antes de salvar.
        const formularioValido = campos.reduce((valido, campo) => {
            campo.reportValidity();
            return campo.checkValidity() && valido;
        }, true);

        // Não continua se algum campo obrigatório for inválido.
        if (!formularioValido) {
            return;
        }

        // Indica que o salvamento começou e limpa mensagens anteriores.
        this.salvando = true;
        this.erro = undefined;
        this.mensagemSucesso = '';

        // Organiza os dados que serão enviados ao método Apex.
        const dados = {
            nome: this.nome.trim(),
            categoria: this.categoria,
            prioridade: this.prioridade,
            descricao: this.descricao,
            responsavelId: this.responsavelId || null,
            dataLimite: this.dataLimite || null,
            valor: this.valor === '' || this.valor === null
                ? null
                : Number(this.valor),
            justificativa: this.justificativa
        };

        try {
            // No modo de edição, atualiza o registro existente.
            if (this.modoEdicao) {
                await atualizarSolicitacao({
                    solicitacaoId: this.solicitacaoSelecionadaId,
                    ...dados
                });

                // Informa que a edição foi concluída.
                this.notificar(
                    'Alteração concluída',
                    'Solicitação atualizada com sucesso.',
                    'success'
                );
            } else {
                // Caso contrário, cria uma nova solicitação.
                await criarSolicitacao(dados);

                // Informa que o cadastro foi concluído.
                this.notificar(
                    'Cadastro concluído',
                    'Solicitação criada com sucesso.',
                    'success'
                );
            }

            // Fecha o formulário e limpa os dados após o sucesso.
            this.mostrarFormulario = false;
            this.limparFormulario();
            this.modoEdicao = false;
            this.solicitacaoSelecionadaId = undefined;

            // Limpa a pesquisa para mostrar novamente a lista completa.
            this.termoPesquisa = '';

            // Atualiza a tabela com os dados mais recentes.
            await this.carregarSolicitacoes();

            if (this.ehResponsavel) {
                await this.carregarIndicadores();
            }

        } catch (error) {
            // Armazena o erro e avisa o usuário que não foi possível salvar.
            this.erro = error;

            this.notificar(
                'Não foi possível salvar',
                this.mensagemErro(error),
                'error'
            );
        } finally {
            // Libera o botão independentemente do resultado da operação.
            this.salvando = false;
        }
    }

    // Restaura os campos do formulário para seus valores iniciais.
    limparFormulario() {
        this.nome = '';
        this.categoria = '';
        this.prioridade = 'Média';
        this.descricao = '';
        this.responsavelId = '';
        this.dataLimite = '';
        this.valor = null;
        this.justificativa = '';
    }

    // Consulta usuários ativos para preencher o campo Responsável.
    carregarResponsaveis() {
        buscarResponsaveis({
            termoPesquisa: this.termoResponsavel
        })
            .then(resultado => {
                // Converte cada usuário em uma opção para o combobox.
                this.opcoesResponsavel = resultado.map(usuario => ({
                    label: usuario.Name,
                    value: usuario.Id
                }));
            })
            .catch(error => {
                // Armazena eventual erro na consulta de responsáveis.
                this.erro = error;
            });
    }

    // Extrai uma mensagem útil dos diferentes formatos de erro do Salesforce.
    mensagemErro(error) {
        return error?.body?.message
            || error?.message
            || 'Ocorreu um erro inesperado.';
    }
}