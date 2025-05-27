                      <ListItemText
                        primary={appointment.cliente?.usuario.nombre}
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            <span style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                              <AccessTimeIcon fontSize="small" style={{ marginRight: '4px', fontSize: 16 }} color="action" />
                              {new Date(appointment.fechaHora).toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit'
                              })} - {appointment.servicio?.nombre}
                            </span>
                          </Typography>
                        }
                      /> 