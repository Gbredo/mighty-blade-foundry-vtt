# 💼 Estratégia de Negócio, Monetização Ética & Conformidade LGPD
### Plataforma Mesas do Breder — Plano Diretor Jurídico e Comercial

Este documento consolida as diretrizes de **Proteção de Propriedade Intelectual (PI)**, conformidade com a **LGPD (Lei nº 13.709/2018)** e o modelo de **Monetização Ética e Não-Predatória** da plataforma **Mesas do Breder**.

---

## 1. ⚖️ Proteção Jurídica da Propriedade Intelectual

Sendo uma aplicação com arquitetura proprietária, algoritmos canônicos e interface autoral, a proteção legal no Brasil se divide em três esferas:

### A. Registro de Programa de Computador no INPI (Lei nº 9.609/1998)
* **Software é Patenteável?**
  * Não como patente de invenção clássica (o art. 10, V da Lei 9.279/1996 veda expressamente patente de software puro).
  * No entanto, o software recebe **Proteção de Direitos Autorais e Propriedade Intelectual** via **Registro de Programa de Computador no INPI**.
* **Como Funciona:**
  * É um processo 100% digital via portal e-INPI.
  * O desenvolvedor gera o Hash Criptográfico (SHA-512) do código-fonte compactado do monorepo (`rules-core`, `apps/web`, `apps/api`).
  * O INPI emite o **Certificado Oficial de Registro de Software**, garantindo presunção legal de autoria e exclusividade moral/patrimonial por **50 anos** em mais de 175 países signatários da Convenção de Berna.
  * Custo da taxa federal (GRU): extremamente acessível para pessoa física/MEI (com 60% de desconto legal).

### B. Registro de Marca no INPI (Lei nº 9.279/1996)
* **Marca:** **"Mesas do Breder"** (Nominativa ou Mista com o logotipo).
* **Classes Recomendadas (Classificação Nice):**
  * **Classe 42:** Serviços científicos e tecnológicos; concepção e desenvolvimento de software e plataformas web (SaaS).
  * **Classe 41:** Serviços de entretenimento, jogos online e atividades culturais (RPG).

### C. Relação com o Mighty Blade (Coisinha Verde / Tiago Junges)
* O sistema de regras canônicas Mighty Blade pertence aos seus autores originais.
* **O que pertence a Guilherme Breder:** A implementação computacional, a arquitetura do software, a plataforma web, o design do sistema, as ferramentas proprietárias (Build-a-Beast, Alquimia Witcher-style, adaptadores VTT) e a marca **Mesas do Breder**.

---

## 2. 🛡️ Plano de Conformidade com a LGPD (Lei nº 13.709/2018)

Para operar com usuários cadastrados, banco de dados (PostgreSQL/Prisma) e transações financeiras, a plataforma adotará o princípio de **Privacy by Design**:

| Princípio da LGPD | Aplicação Prática no "Mesas do Breder" |
| :--- | :--- |
| **Finalidade (Art. 6º, I)** | Os dados coletados (e-mail, nome de usuário) servem estritamente para autenticação, sincronização de fichas e campanhas. |
| **Necessidade / Minimização (Art. 6º, III)** | Não coletar dados sensíveis desnecessários (CPF ou telefone só são exigidos por gateways de pagamento em assinaturas). |
| **Segurança (Art. 6º, VII)** | Senhas armazenadas com hash forte (Argon2 / bcrypt); tráfego 100% criptografado com SSL/TLS. |
| **Livre Acesso & Portabilidade (Art. 18)** | Botão no painel do usuário para exportar todas as suas fichas e campanhas em JSON canônico. |
| **Direito ao Esquecimento (Art. 18, VI)** | Botão "Excluir Minha Conta", que remove os dados pessoais do banco e anonimiza campanhas órfãs. |

---

## 3. 🪙 Modelo de Monetização Ético (Anti-Predatório)

O mercado de RPG valoriza a comunidade e repele modelos predatórios (pay-to-win ou paywalls agressivos). O modelo do **Mesas do Breder** apoia-se em 4 pilares:

### Pilar 1: Tier Gratuito Sustentável (Free / Comunidade)
* Criação de fichas de jogadores ilimitadas ou generosas.
* Acesso completo ao Compêndio Canônico (Regras, Bestiário e Arsenal).
* Participação livre em mesas criadas por Mestres.
* *Objetivo:* Alimentar a base de jogadores que jogam nas mesas dos mestres.

### Pilar 2: Assinatura de Ferramentas de Produtividade (Mestre Premium)
* **Dashboard de Campanhas Ilimitadas:** Gestão de múltiplas mesas com pastas de party e etiquetas de alinhamento.
* **Barra de Afinidade / Reputação (DMV):** Sistema de relacionamento entre PNJs e grupos (-100 a +100).
* **Build-a-Beast Dinâmico:** Gerador de monstros com IA e balanceamento matemático automático.
* **Exportação em Lote:** Sincronização direta com Foundry VTT em 1 clique.
* **Backup na Nuvem:** Backup automático das campanhas no banco de dados.

### Pilar 3: "Faça Seu Jogo / Me Contrate" (Vitrine Profissional)
* Um espaço no site onde editoras independentes, criadores de RPG e mestres podem contratar os serviços de Guilherme Breder como **Engenheiro de Software Fullstack** para:
  * Criar fichas e sistemas customizados para outros RPGs (Tormenta20, D&D, Savage Worlds, sistemas autorais).
  * Desenvolver módulos sob medida para Foundry VTT.
  * Criar landing pages e ferramentas digitais para campanhas de financiamento coletivo (Catarse).

### Pilar 4: Comunidade & Apoio Não-Intrusivo
* **"Anuncie Aqui":** Espaço discreto para artistas de RPG, canais de streaming e financiamentos coletivos da comunidade.
* **Apoie o Projeto (Catarse / Ko-fi / Pix):** Doações voluntárias que concedem emblemas e cosméticos de perfil.
