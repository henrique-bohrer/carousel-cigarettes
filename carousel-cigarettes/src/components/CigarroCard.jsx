import styles from './CigarroCard.module.css'; // Importa o CSS Module

const CigarroCard = (props) => {
  const { cigarro } = props;

  if (!cigarro) {
    return null;
  }

  return (
    <div className={styles.card}>
      <img className={styles.cardImage} src={cigarro.imageUrl} alt={`Imagem de ${cigarro.marca}`} />

      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{cigarro.marca} - {cigarro.tipo}</div>
        <p className={styles.cardDescription}>
          {cigarro.descricao}
        </p>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.tag}>
          Origem: {cigarro.origem}
        </span>
      </div>
    </div>
  );
};

export default CigarroCard;