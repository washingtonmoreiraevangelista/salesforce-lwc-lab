
public with sharing class SolicitacaoController {

	// =========================================================
	// IDENTIFICAR O RESPONSÁVEL
	// Verifica se o perfil do usuário conectado é o responsável.
	// =========================================================
	@AuraEnabled(cacheable=true)
	public static Boolean usuarioEhResponsavel() {
		User usuario = [
			SELECT Profile.Name
			FROM User
			WHERE Id = :UserInfo.getUserId()
			LIMIT 1
		];

		return usuario.Profile.Name == 'Usuário de plataforma padrão';
	}

	// =========================================================
	// BUSCAR SOLICITAÇÕES
	// Responsável consulta todas.
	// Solicitante consulta somente as próprias.
	// =========================================================
	@AuraEnabled(cacheable=true)
	public static List<Solicita_o__c> buscarSolicitacoes(
		String termoPesquisa
	) {
		String termo = String.isBlank(termoPesquisa)
			? ''
			: termoPesquisa.trim();

		Id usuarioAtual = UserInfo.getUserId();

		if (usuarioEhResponsavel()) {
			return [
				SELECT Id, Name, Status__c, Prioridade__c,
					   Categoria__c, Data_Limite__c, Valor__c,
					   Descri_o__c, Respons_vel__c, Justificativa__c
				FROM Solicita_o__c
				WHERE Name LIKE :('%' + termo + '%')
				ORDER BY CreatedDate DESC
				LIMIT 100
			];
		}

		return [
			SELECT Id, Name, Status__c, Prioridade__c,
				   Categoria__c, Data_Limite__c, Valor__c,
				   Descri_o__c, Respons_vel__c, Justificativa__c
			FROM Solicita_o__c
			WHERE Name LIKE :('%' + termo + '%')
			  AND Solicitante__c = :usuarioAtual
			ORDER BY CreatedDate DESC
			LIMIT 100
		];
	}

	// =========================================================
	// CRIAR SOLICITAÇÃO
	// Registra o usuário conectado como solicitante.
	// Somente o responsável pode definir o responsável atribuído.
	// =========================================================
	@AuraEnabled
	public static Id criarSolicitacao(
		String nome,
		String categoria,
		String prioridade,
		String descricao,
		String responsavelId,
		Date dataLimite,
		Decimal valor,
		String justificativa
	) {
		Boolean responsavel = usuarioEhResponsavel();

		if (!responsavel && !String.isBlank(responsavelId)) {
			throw new AuraHandledException(
				'O solicitante não pode definir o responsável.'
			);
		}

		Solicita_o__c novaSolicitacao = new Solicita_o__c(
			Name = nome,
			Categoria__c = categoria,
			Prioridade__c = prioridade,
			Descri_o__c = descricao,
			Solicitante__c = UserInfo.getUserId(),
			Status__c = 'Nova',
			Data_da_Solicita_o__c = Date.today(),
			Respons_vel__c =
				responsavel && !String.isBlank(responsavelId)
				? responsavelId
				: null,
			Data_Limite__c = dataLimite,
			Valor__c = valor,
			Justificativa__c = justificativa,
			Aprovado__c = false
		);

		insert novaSolicitacao;
		return novaSolicitacao.Id;
	}

	// =========================================================
	// BUSCAR RESPONSÁVEIS
	// Somente o perfil responsável pode consultar usuários ativos.
	// =========================================================
	@AuraEnabled(cacheable=true)
	public static List<User> buscarResponsaveis(String termoPesquisa) {
		if (!usuarioEhResponsavel()) {
			return new List<User>();
		}

		String termo = String.isBlank(termoPesquisa)
			? ''
			: termoPesquisa.trim();

		return [
			SELECT Id, Name
			FROM User
			WHERE IsActive = true
			  AND Name LIKE :('%' + termo + '%')
			ORDER BY Name
			LIMIT 100
		];
	}

	// =========================================================
	// ATUALIZAR SOLICITAÇÃO
	// Somente o responsável pode editar qualquer solicitação.
	// A operação usa SYSTEM_MODE e retorna erros de gravação.
	// =========================================================
	@AuraEnabled
	public static void atualizarSolicitacao(
		Id solicitacaoId,
		String nome,
		String categoria,
		String prioridade,
		String descricao,
		String responsavelId,
		Date dataLimite,
		Decimal valor,
		String justificativa
	) {
		if (!usuarioEhResponsavel()) {
			throw new AuraHandledException(
				'Somente o responsável pode editar solicitações.'
			);
		}

		if (solicitacaoId == null) {
			throw new AuraHandledException(
				'O ID da solicitação é obrigatório.'
			);
		}

		List<Solicita_o__c> registros = [
			SELECT Id
			FROM Solicita_o__c
			WHERE Id = :solicitacaoId
			LIMIT 1
		];

		if (registros.isEmpty()) {
			throw new AuraHandledException(
				'Solicitação não encontrada.'
			);
		}

		Solicita_o__c solicitacao = registros[0];

		solicitacao.Name = nome;
		solicitacao.Categoria__c = categoria;
		solicitacao.Prioridade__c = prioridade;
		solicitacao.Descri_o__c = descricao;
		solicitacao.Respons_vel__c =
			String.isBlank(responsavelId) ? null : responsavelId;
		solicitacao.Data_Limite__c = dataLimite;
		solicitacao.Valor__c = valor;
		solicitacao.Justificativa__c = justificativa;

		Database.SaveResult resultado = Database.update(
			solicitacao,
			AccessLevel.SYSTEM_MODE
		);

		if (!resultado.isSuccess()) {
			throw new AuraHandledException(
				resultado.getErrors()[0].getMessage()
			);
		}
	}

	// =========================================================
	// EXCLUIR SOLICITAÇÃO
	// Somente o responsável pode excluir qualquer solicitação.
	// =========================================================
	@AuraEnabled
	public static void excluirSolicitacao(Id solicitacaoId) {
		if (!usuarioEhResponsavel()) {
			throw new AuraHandledException(
				'Somente o responsável pode excluir solicitações.'
			);
		}

		if (solicitacaoId == null) {
			throw new AuraHandledException(
				'O ID da solicitação é obrigatório.'
			);
		}

		List<Solicita_o__c> registros = [
			SELECT Id
			FROM Solicita_o__c
			WHERE Id = :solicitacaoId
			LIMIT 1
		];

		if (registros.isEmpty()) {
			throw new AuraHandledException(
				'Solicitação não encontrada.'
			);
		}

		Database.DeleteResult resultado = Database.delete(
			registros[0],
			AccessLevel.SYSTEM_MODE
		);

		if (!resultado.isSuccess()) {
			throw new AuraHandledException(
				resultado.getErrors()[0].getMessage()
			);
		}
	}

	// =========================================================
	// CANCELAR SOLICITAÇÃO
	// O responsável pode cancelar qualquer solicitação.
	// O solicitante pode cancelar somente a própria.
	// Solicitações concluídas não podem ser canceladas.
	// =========================================================
	@AuraEnabled
	public static void cancelarSolicitacao(Id solicitacaoId) {
		if (solicitacaoId == null) {
			throw new AuraHandledException(
				'O ID da solicitação é obrigatório.'
			);
		}

		List<Solicita_o__c> registros = [
			SELECT Id, Status__c, Solicitante__c
			FROM Solicita_o__c
			WHERE Id = :solicitacaoId
			LIMIT 1
		];

		if (registros.isEmpty()) {
			throw new AuraHandledException(
				'Solicitação não encontrada.'
			);
		}

		Solicita_o__c solicitacao = registros[0];

		Boolean responsavel = usuarioEhResponsavel();
		Boolean ehSolicitante =
			solicitacao.Solicitante__c == UserInfo.getUserId();

		if (!responsavel && !ehSolicitante) {
			throw new AuraHandledException(
				'Você não tem permissão para cancelar esta solicitação.'
			);
		}

		if (solicitacao.Status__c == 'Concluída') {
			throw new AuraHandledException(
				'Não é possível cancelar uma solicitação concluída.'
			);
		}

		solicitacao.Status__c = 'Cancelada';

		Database.SaveResult resultado = Database.update(
			solicitacao,
			AccessLevel.SYSTEM_MODE
		);

		if (!resultado.isSuccess()) {
			throw new AuraHandledException(
				resultado.getErrors()[0].getMessage()
			);
		}
	}

	// =========================================================
	// BUSCAR INDICADORES
	// Somente o responsável consulta os indicadores gerais.
	// =========================================================
	@AuraEnabled(cacheable=true)
	public static Map<String, Integer> buscarIndicadores() {
		if (!usuarioEhResponsavel()) {
			throw new AuraHandledException(
				'Você não tem permissão para consultar os indicadores.'
			);
		}

		Map<String, Integer> indicadores = new Map<String, Integer>{
			'total' => 0,
			'pendentes' => 0,
			'urgentes' => 0,
			'aprovadas' => 0,
			'canceladas' => 0
		};

		for (AggregateResult resultado : [
			SELECT Status__c status,
				   Prioridade__c prioridade,
				   COUNT(Id) quantidade
			FROM Solicita_o__c
			GROUP BY Status__c, Prioridade__c
		]) {
			String status = (String) resultado.get('status');
			String prioridade = (String) resultado.get('prioridade');
			Integer quantidade = (Integer) resultado.get('quantidade');

			indicadores.put(
				'total',
				indicadores.get('total') + quantidade
			);

			if (status == 'Nova' || status == 'Em análise') {
				indicadores.put(
					'pendentes',
					indicadores.get('pendentes') + quantidade
				);
			}

			if (prioridade == 'Urgente') {
				indicadores.put(
					'urgentes',
					indicadores.get('urgentes') + quantidade
				);
			}

			if (status == 'Aprovada') {
				indicadores.put(
					'aprovadas',
					indicadores.get('aprovadas') + quantidade
				);
			}

			if (status == 'Cancelada') {
				indicadores.put(
					'canceladas',
					indicadores.get('canceladas') + quantidade
				);
			}
		}

		return indicadores;
	}
}
