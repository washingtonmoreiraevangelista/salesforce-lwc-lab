trigger SolicitacaoTrigger on Solicita_o__c (before insert, before update) {
	for (Solicita_o__c solicitacao : Trigger.new) {
		Boolean prioridadeUrgente = solicitacao.Prioridade__c == 'Urgente';
		Boolean tornouUrgente = Trigger.isInsert;

		if (Trigger.isUpdate) {
			Solicita_o__c anterior = Trigger.oldMap.get(solicitacao.Id);
			tornouUrgente = anterior.Prioridade__c != 'Urgente';
		}

		if (prioridadeUrgente && tornouUrgente) {
			solicitacao.Descri_o__c =
				String.isBlank(solicitacao.Descri_o__c)
				? '[Automação Apex] Solicitação marcada como urgente.'
				: solicitacao.Descri_o__c + '\n[Automação Apex] Solicitação marcada como urgente.';
		}
	}
}