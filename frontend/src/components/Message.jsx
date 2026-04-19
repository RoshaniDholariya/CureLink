export default function Message({ msg }) {
  return (
    <div className={`message ${msg.type}`}>
      <div className="message-bubble">{msg.text}</div>
    </div>
  );
}
