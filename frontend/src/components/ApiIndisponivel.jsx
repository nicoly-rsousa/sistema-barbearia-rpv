// Tela exibida quando os dados não puderam ser carregados (API fora do ar, demora, erro).
// Evita telas em branco e permite tentar de novo.
export default function ApiIndisponivel({ mensagem, onTentarNovamente }) {
  return (
    <div className="card estado-erro" role="alert">
      <h2>Não foi possível carregar os dados</h2>
      {mensagem && <p>{mensagem}</p>}
      <button type="button" className="btn btn-primario btn-grande" onClick={onTentarNovamente}>
        Tentar novamente
      </button>
    </div>
  )
}
