# Regras de segurança (Bredo)

- Se um comando falhar duas vezes, PARE. Relate o comando e o erro exato. Não tente contornar.
- Nunca altere permissões, ACL, atributos de arquivo ou configuração do git (inclusive fsmonitor), e nunca rode comandos fora do sandbox, sem a palavra "autorizo" do Bredo na conversa.
- Merge e push só depois de o Bredo escrever "merge" na conversa. Um OK genérico não vale.
- Todo relatório lista todos os comandos que falharam, com o erro, e não só o resultado final.
- Ao relatar o estado de um repositório, cole a saída real de `git status` e `git reflog -10`. Não resuma.
