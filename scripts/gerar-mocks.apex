
/*
 * Gerador de dados mock para o objeto Solicita_o__c.
 * Cria solicitações com dados variados para testes.
 */

// Quantidade de registros que serão criados.
Integer quantidade = 30;

// Opções de dados disponíveis.
List<String> categorias = new List<String>{
    'Tecnologia',
    'Compras',
    'Financeiro',
    'Manutenção',
    'Administrativo',
    'Outros'
};

List<String> prioridades = new List<String>{
    'Baixa',
    'Média',
    'Alta',
    'Urgente'
};

List<String> statusDisponiveis = new List<String>{
    'Nova',
    'Em análise',
    'Aprovada',
    'Rejeitada',
    'Concluída'
};

List<String> assuntos = new List<String>{
    'Solicitação de equipamento',
    'Compra de materiais',
    'Manutenção preventiva',
    'Acesso a sistema',
    'Análise financeira',
    'Apoio administrativo',
    'Atualização de computador',
    'Reparo de equipamento',
    'Solicitação de licença',
    'Aquisição de suprimentos'
};

List<Solicita_o__c> registros = new List<Solicita_o__c>();

// Gera os registros com valores aleatórios.
for (Integer i = 0; i < quantidade; i++) {

    String categoria =
        categorias[Math.mod(Math.abs(Crypto.getRandomInteger()), categorias.size())];

    String prioridade =
        prioridades[Math.mod(Math.abs(Crypto.getRandomInteger()), prioridades.size())];

    // Evita usar o status Concluída para não exigir
    // a data de conclusão pela regra de validação.
    List<String> statusPermitidos = new List<String>{
        'Nova', 'Em análise', 'Aprovada', 'Rejeitada'
    };

    String status =
        statusPermitidos[Math.mod(Math.abs(Crypto.getRandomInteger()), statusPermitidos.size())];

    String assunto =
        assuntos[Math.mod(Math.abs(Crypto.getRandomInteger()), assuntos.size())];

    Integer dias =
        Math.mod(Math.abs(Crypto.getRandomInteger()), 61);

    Decimal valor =
        Math.mod(Math.abs(Crypto.getRandomInteger()), 10000) / 100.0;

    registros.add(new Solicita_o__c(
        Name = assunto + ' ' + (i + 1),
        Categoria__c = categoria,
        Prioridade__c = prioridade,
        Status__c = status,
        Descri_o__c = 'Registro mock gerado automaticamente para testes.',
        Solicitante__c = UserInfo.getUserId(),
        Data_da_Solicita_o__c = Date.today(),
        Data_Limite__c = Date.today().addDays(dias),
        Valor__c = valor,
        Aprovado__c = status == 'Aprovada',
        Justificativa__c = 'Dados fictícios para testes do sistema.'
    ));
}

// Insere todos os registros em uma única operação DML.
insert registros;

System.debug(
    'Total de registros mock criados: ' + registros.size()
);
